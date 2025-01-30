import { QuestionMarkCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import Papa, { ParseResult } from "papaparse";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { DeepPartial } from "react-hook-form";
import { useResolvedPath } from "react-router";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import Autocomplete from "../../../components/forms/inputs/Autocomplete";
import EnrollmentSelect from "../../../components/forms/inputs/EnrollmentSelect";
import Input from "../../../components/forms/inputs/Input";
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import Dropdown from "../../../components/layouts/Dropdown";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import DataTable from "../../../components/layouts/tables/DataTable";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import {
  getMyOrganization,
  getOrganizationBySlug,
  getUnitBySlug,
  getUnits,
} from "../../../queries/organizations";
import {
  getTrainingCourse,
  getTrainingItem,
  getTrainingItems,
} from "../../../queries/training";
import {
  getTrainingInvites,
  getTrainingInvitesCsv,
  resendTrainingLinks,
  sendTrainingLinks,
} from "../../../queries/training-admin";
import {
  ResendTrainingLinksDto,
  SendTrainingLinksDto,
  TrainingParticipantRepresentation,
} from "../../../types/api";
import { SimpleChangeEvent } from "../../../types/core";
import {
  CourseEnrollment,
  Organization,
  TrainingItem,
  TrainingToken,
} from "../../../types/entities";
import { simulateDownload, stripHtml } from "../../../utils/core";
import ViewPercentWatched from "./components/ViewPercentWatched";
import ManageTrainingInvite from "./ManageTrainingInvite";

interface InviteCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  organizationSlug: string;
  unitSlug: string;
  enrollmentId: string;
  trainingItemId: string;
}

const CSV_HEADERS_MAPPER = new Map<string, InviteCsvRow[keyof InviteCsvRow]>([
  ["firstname", "firstName"],
  ["lastname", "lastName"],
  ["email", "email"],
  ["givenname", "firstName"],
  ["familyname", "lastName"],
  ["emailaddress", "email"],
  ["surname", "lastName"],
  ["organization", "organizationSlug"],
  ["organizationslug", "organizationSlug"],
  ["unit", "unitSlug"],
  ["unitslug", "unitSlug"],
  ["school", "unitSlug"],
  ["enrollment", "enrollmentId"],
  ["enrollmentid", "enrollmentId"],
  ["courseenrollmentid", "enrollmentId"],
  ["courseenrollment", "enrollmentId"],
  ["trainingcourseenrollmentid", "enrollmentId"],
  ["trainingcourseenrollment", "enrollmentId"],
  ["item", "trainingItemId"],
  ["trainingitem", "trainingItemId"],
  ["trainingitemid", "trainingItemId"],
]);

const normalizeHeader = (h: string) =>
  CSV_HEADERS_MAPPER.get(h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()) || h;

const ViewTrainingItem: React.FC<{ trainingItemId?: string }> = ({
  trainingItemId,
}) => {
  const { data: trainingItemMetadata, isLoading } = useQuery({
    queryKey: ["training-item-metadata", trainingItemId] as const,
    queryFn: ({ queryKey }) =>
      getTrainingItem(queryKey[1]).then((t) => t?.metadata ?? null),
    enabled: !!trainingItemId,
  });
  const title = stripHtml(trainingItemMetadata?.title);
  return isLoading ? (
    <div className="animate-pulse rounded bg-slate-200 w-full h-6" />
  ) : (
    <span>
      {trainingItemMetadata ? (
        <span className="line-clamp-3" title={title ?? undefined}>
          {title}
        </span>
      ) : trainingItemMetadata === null ? (
        <span className="inline-flex items-center gap-1">
          Unknown{" "}
          <QuestionMarkCircleIcon
            className="h-4 w-4"
            title="Training is unavailable or not visible to you."
          />
        </span>
      ) : (
        "—"
      )}
    </span>
  );
};

const ViewOrganization: React.FC<{ organizationSlug?: string }> = ({
  organizationSlug,
}) => {
  const { data: organizationName, isLoading } = useQuery({
    queryKey: ["organization-name", organizationSlug] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationBySlug(queryKey[1]).then((o) => o?.name ?? null),
    enabled: !!organizationSlug,
  });
  return isLoading ? (
    <div className="animate-pulse rounded bg-slate-200 w-full h-6" />
  ) : (
    <span className="line-clamp-3" title={organizationName ?? undefined}>
      {organizationName ? organizationName : "—"}
    </span>
  );
};

const ViewUnit: React.FC<{ unitSlug?: string }> = ({ unitSlug }) => {
  const { data: unitName, isLoading } = useQuery({
    queryKey: ["unit-name", unitSlug] as const,
    queryFn: ({ queryKey }) =>
      getUnitBySlug(queryKey[1]).then((u) => u?.name ?? null),
    enabled: !!unitSlug,
  });
  return isLoading ? (
    <div className="animate-pulse rounded bg-slate-200 w-full h-6" />
  ) : (
    <span className="line-clamp-3" title={unitName ?? undefined}>
      {unitName ? unitName : "—"}
    </span>
  );
};

const ManageTrainingInvites: React.FC = () => {
  const [tokenValues, setTokenValues] = useImmer<
    Partial<TrainingParticipantRepresentation>[]
  >([
    {
      firstName: "",
      lastName: "",
      email: "",
    },
  ]);
  const [selectedOrganization, setSelectedOrganization] = useState<
    Organization | undefined | null
  >();
  const [selectedEnrollment, setSelectedEnrollment] = useState<
    CourseEnrollment | DeepPartial<CourseEnrollment> | undefined | null
  >();
  const [selectedItem, setSelectedItem] = useState<
    TrainingItem | undefined | null
  >();
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [manageTrainingInviteSliderOpen, setManageTrainingInviteSliderOpen] =
    useState(false);
  const [selectedTrainingInvite, setSelectedTrainingInvite] =
    useState<TrainingToken>();

  const { hasMultipleUnitAccess, hasMultipleOrganizationAccess } = useAuth();
  const { setError } = useContext(AlertContext);
  const { setSuccess, setInfo, clearAlert } = useContext(AlertContext);
  const clipboardAlertId = useAlertId();
  const infoAlertId = useAlertId();

  const watchTrainingPath = useResolvedPath("/watch-training/");

  const [itemFilterOptions, setItemFilterOptions] =
    useImmer<ItemFilterQueryParams>({});

  const { data: trainingInvites, isLoading: trainingInvitesLoading } = useQuery(
    {
      queryKey: ["training-invites", itemFilterOptions] as const,
      queryFn: ({ queryKey }) => getTrainingInvites(queryKey[1]),
    }
  );

  const [trainingItemFilterQuery, setTrainingItemFilterQuery] =
    useImmer<ItemFilterQueryParams>({ limit: 10 });
  const [debouncedTrainingItemFilterQuery] = useDebounceValue(
    trainingItemFilterQuery,
    300
  );
  const { data: trainingItems, isLoading: trainingItemsLoading } = useQuery({
    queryKey: ["training-items", debouncedTrainingItemFilterQuery] as const,
    queryFn: ({ queryKey }) => getTrainingItems(queryKey[1]),
  });

  const { data: allTrainingItems } = useQuery({
    queryKey: [
      "training-course-items",
      selectedEnrollment?.course?.id,
    ] as const,
    queryFn: ({ queryKey }) =>
      getTrainingCourse(queryKey[1]).then((c) =>
        Array.from(
          c?.sections
            .flatMap((s) => s.items?.map((i) => i.item) ?? [])
            .reduce((arr, i) => {
              arr.set(i.id, i);
              return arr;
            }, new Map<TrainingItem["id"], TrainingItem>())
            .values() ?? []
        )
      ),
    enabled: !!selectedEnrollment?.course?.id,
  });

  const availableUnitsQuery = useMemo(() => {
    const q: ItemFilterQueryParams = { limit: 500 };

    if (hasMultipleOrganizationAccess && selectedOrganization) {
      q["organization.id"] = selectedOrganization.id;
    }

    return q;
  }, [hasMultipleOrganizationAccess, selectedOrganization]);

  const { data: availableUnits } = useQuery({
    queryKey: ["units", availableUnitsQuery] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
    enabled:
      hasMultipleUnitAccess &&
      (!!selectedOrganization || !hasMultipleOrganizationAccess),
  });

  const findUnit = useCallback(
    (search: string) => {
      const fuse = new Fuse(availableUnits?.results ?? [], {
        keys: ["name", "slug"],
        includeScore: true,
      });

      return fuse.search(search)[0]?.item ?? null;
    },
    [availableUnits]
  );

  const organizationFilters = useOrganizationFilters({
    query: itemFilterOptions,
    setQuery: setItemFilterOptions,
    organizationsEnabled: hasMultipleOrganizationAccess,
    organizationKey: "organizationSlug",
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "unitSlug",
    locationsEnabled: false,
  });

  const filteredTrainingItems = useMemo(() => {
    if (!allTrainingItems) {
      return [];
    }

    return allTrainingItems.filter(
      (i) =>
        !itemSearchQuery ||
        i.metadata.title?.toLowerCase().includes(itemSearchQuery.toLowerCase())
    );
  }, [allTrainingItems, itemSearchQuery]);

  const inviteCSVUploadFn = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const { data: rows } = await new Promise<ParseResult<InviteCsvRow>>(
      (resolve) =>
        Papa.parse<InviteCsvRow, File>(file, {
          header: true,
          transformHeader: normalizeHeader,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
        })
    );

    let organizationSlugFromCsv: string | undefined = undefined;
    let enrollmentIdFromCsv: string | undefined = undefined;
    let trainingItemIdFromCsv: string | undefined = undefined;

    const results: {
      organization?: Organization;
      enrollment?: CourseEnrollment;
      item?: TrainingItem;
      tokenValues: Partial<TrainingParticipantRepresentation>[];
    } = {
      tokenValues: [],
    };

    for (const row of rows) {
      if (row.organizationSlug && !organizationSlugFromCsv) {
        organizationSlugFromCsv = row.organizationSlug;

        if (row.enrollmentId && !enrollmentIdFromCsv) {
          enrollmentIdFromCsv = row.enrollmentId;

          if (row.trainingItemId && !trainingItemIdFromCsv) {
            trainingItemIdFromCsv = row.trainingItemId;
          }
        }
      }

      results.tokenValues.push({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        unitSlug: findUnit(row.unitSlug)?.slug,
      });
    }

    if (!hasMultipleOrganizationAccess || organizationSlugFromCsv) {
      results.organization = await (hasMultipleOrganizationAccess
        ? getOrganizationBySlug(organizationSlugFromCsv)
        : getMyOrganization());

      if (enrollmentIdFromCsv) {
        results.enrollment = results.organization.enrollments?.find(
          (e) => e.id === enrollmentIdFromCsv
        );

        if (trainingItemIdFromCsv) {
          const course = await getTrainingCourse(
            results.enrollment?.course?.id
          );
          results.item = course?.sections
            .flatMap((s) => s.items?.map((i) => i.item) ?? [])
            .find((i) => i.id === trainingItemIdFromCsv);
        }
      }
    }

    return results;
  };

  const inviteCSVUploadMutation = useMutation({
    mutationFn: inviteCSVUploadFn,
    onSuccess: (data) => {
      if (data) {
        setTokenValues(data.tokenValues);
        setSelectedOrganization(data.organization);
        setSelectedEnrollment(data.enrollment);
        setSelectedItem(data.item);
      }
    },
  });

  const handleUpdateInvite = (
    idx: number,
    key: keyof Omit<TrainingParticipantRepresentation, "audiences">,
    e: SimpleChangeEvent<string>
  ) => {
    setTokenValues((draft) => {
      let value = e.target?.value;
      if (key === "unitSlug" && value && typeof value !== "string") {
        value = (value as { slug: string }).slug;
      }
      draft[idx][key] = value;
    });
  };

  const handleAddInvite = () => {
    setTokenValues((draft) => {
      draft.push({
        firstName: "",
        lastName: "",
        email: "",
      });
    });
  };

  const handleDeleteInvite = (idx: number) => {
    setTokenValues((draft) => {
      draft.splice(idx, 1);
    });
  };

  const queryClient = useQueryClient();
  const sendTrainingLinksMutation = useMutation({
    mutationFn: (body: SendTrainingLinksDto) => sendTrainingLinks(body),
    onSuccess: () => {
      setSuccess("Invites successfully sent!", { timeout: 5000 });
      setTokenValues([{ firstName: "", lastName: "", email: "" }]);
      setSelectedOrganization(undefined);
      setSelectedEnrollment(undefined);
      setSelectedItem(undefined);
      queryClient.invalidateQueries({ queryKey: ["training-invites"] });
    },
  });

  const resendTrainingLinkMutation = useMutation({
    mutationFn: (body: ResendTrainingLinksDto) => resendTrainingLinks(body),
    onSuccess: () => {
      setSuccess("Invite successfully resent!", { timeout: 5000 });
    },
  });

  const onSubmitSendInvites = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedEnrollment?.id) {
      setError("No course enrollment selected.", { timeout: 5000 });
      return;
    }

    if (!selectedItem) {
      setError("No training item selected.", { timeout: 5000 });
      return;
    }

    const preparedRequest: SendTrainingLinksDto = {
      trainingTokenValues: tokenValues.map((t) => ({
        ...t,
        userId: t.email,
      })),
      trainingUrlTemplate: `${window.location.origin}${watchTrainingPath.pathname}{trainingItemId}?watchId={token}`,
      courseEnrollmentId: selectedEnrollment.id,
      trainingItemId: selectedItem?.id,
      organizationId: selectedOrganization?.id,
    };

    sendTrainingLinksMutation.mutate(preparedRequest);
  };

  const copyTrainingUrl = (token: TrainingToken) => {
    const url = `${window.location.origin}${watchTrainingPath.pathname}${token.value.trainingItemId}?watchId=${token.key}`;
    navigator.clipboard.writeText(url);
    setSuccess("Copied training link to clipboard", {
      id: clipboardAlertId,
      timeout: 5000,
    });
  };

  const viewInvite = (token: TrainingToken) => {
    setSelectedTrainingInvite(token);
    setManageTrainingInviteSliderOpen(true);
  };

  const handleResendInvite = (token: TrainingToken) => {
    resendTrainingLinkMutation.mutate({
      trainingTokenIds: [token.id],
      trainingUrlTemplate: `${window.location.origin}${watchTrainingPath.pathname}{trainingItemId}?watchId={token}`,
    });
  };

  const downloadTrainingLinksCsvMutation = useMutation({
    mutationFn: (args: {
      trainingUrlTemplate: string;
      query: ItemFilterQueryParams;
    }) => getTrainingInvitesCsv(args.trainingUrlTemplate, args.query),
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "training-links.csv");
      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const handleDownloadTrainingLinksCsv = () => {
    setInfo("Downloading CSV...", { id: infoAlertId });
    downloadTrainingLinksCsvMutation.mutate({
      trainingUrlTemplate: `${window.location.origin}${watchTrainingPath.pathname}{trainingItemId}?watchId={token}`,
      query: itemFilterOptions,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-16">
        <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center ">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Manage Training Invites
          </h1>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmitSendInvites}>
          {/* SEND NEW INVITES */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-base font-semibold leading-6 text-gray-900">
                Send New Invites
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Send members of your organization email invites to watch
                specific trainings.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <label className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600">
                + Upload From CSV
                <input
                  type="file"
                  onChange={inviteCSVUploadMutation.mutate}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {hasMultipleOrganizationAccess && (
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Select an organization
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <OrganizationSelect
                  value={selectedOrganization}
                  onChange={(e) =>
                    setSelectedOrganization(
                      e.target?.value as Organization | undefined
                    )
                  }
                  required
                />
              </div>
            </div>
          )}
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Select a course enrollment
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <EnrollmentSelect
                value={selectedEnrollment}
                onChange={(e) => setSelectedEnrollment(e.target?.value)}
                immediate
                required
                disabled={
                  hasMultipleOrganizationAccess && !selectedOrganization
                }
                organizationId={selectedOrganization?.id}
              />
            </div>
          </div>
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Select a training item
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <Autocomplete
                value={selectedItem ?? null}
                onChange={setSelectedItem}
                onRemove={() => setSelectedItem(null)}
                setQuery={setItemSearchQuery}
                options={filteredTrainingItems}
                placeholder="Search for training item in course..."
                displayValue={(i) => stripHtml(i?.metadata.title) ?? ""}
                required
                immediate
                disabled={!selectedEnrollment}
              />
            </div>
          </div>
          <DataTable
            data={{
              headers: [
                {
                  label: "First Name",
                  key: "firstName",
                },
                {
                  label: "Last Name",
                  key: "lastName",
                },
                {
                  label: "Email",
                  key: "email",
                },
                {
                  label: "Unit",
                  key: "unit",
                  hidden: !hasMultipleUnitAccess,
                },
                {
                  label: <span className="sr-only">Delete Invite</span>,
                  key: "delete",
                  align: "right",
                  noSort: true,
                },
              ],
              rows: tokenValues.map((t, idx) => ({
                id: `${idx}`,
                firstName: (
                  <Input
                    value={t.firstName ?? ""}
                    className="w-full"
                    onChange={(e) => handleUpdateInvite(idx, "firstName", e)}
                    required
                  />
                ),
                lastName: (
                  <Input
                    value={t.lastName ?? ""}
                    className="w-full"
                    onChange={(e) => handleUpdateInvite(idx, "lastName", e)}
                    required
                  />
                ),
                email: (
                  <Input
                    value={t.email ?? ""}
                    className="w-full"
                    onChange={(e) => handleUpdateInvite(idx, "email", e)}
                    required
                  />
                ),
                unit: (
                  <UnitSelect
                    value={t.unitSlug && findUnit(t.unitSlug)}
                    onChange={(e) =>
                      handleUpdateInvite(
                        idx,
                        "unitSlug",
                        e as SimpleChangeEvent<string>
                      )
                    }
                    required={true}
                    queryFilter={
                      hasMultipleOrganizationAccess && selectedOrganization
                        ? {
                            ["organization.id"]: selectedOrganization.id,
                          }
                        : undefined
                    }
                    disabled={
                      hasMultipleOrganizationAccess && !selectedOrganization
                    }
                  />
                ),
                delete: (
                  <button type="button" onClick={() => handleDeleteInvite(idx)}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                ),
              })),
            }}
          />
          <button
            type="button"
            className="w-max self-center text-base text-secondary-600 hover:text-secondary-700 transition-colors"
            onClick={() => handleAddInvite()}
          >
            + Add Invite
          </button>
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-700">
              Click "Send Invites" to immediately send training invites via
              email to each of the above recipients.
            </p>
            <button
              type="submit"
              className="w-max self-center block rounded-lg bg-primary-500 px-3 py-2 text-center text-base font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              Send Invites
            </button>
          </div>
        </form>

        {/* VIEW EXISTING INVITES */}
        <DataTable
          dense
          className="text-xs"
          data={{
            headers: [
              {
                label: "Name",
                key: "value.lastName",
              },
              {
                label: "Email",
                key: "value.email",
              },
              {
                label: "Organization",
                key: "value.organizationSlug",
                hidden: !hasMultipleOrganizationAccess,
              },
              {
                label: "Unit",
                key: "value.unitSlug",
                hidden: !hasMultipleUnitAccess,
              },
              {
                label: "Training Item",
                key: "value.trainingItemId",
                noSort: true,
              },
              {
                label: "Created On",
                key: "createdOn",
              },
              {
                label: "Expires",
                key: "expiresOn",
              },
              {
                label: "Percent Watched",
                key: "completion.progress",
                align: "right",
              },
              {
                label: <span className="sr-only">Resend Invite</span>,
                key: "resend",
                align: "right",
                noSort: true,
              },
              {
                label: <span className="sr-only">Options</span>,
                key: "options",
                align: "right",
                noSort: true,
              },
            ],
            rows: (trainingInvites?.results ?? []).map((t) => ({
              id: t.id,
              ["value.lastName"]: (
                <span className="whitespace-nowrap">
                  {(
                    (t.value.lastName ?? "") +
                    ", " +
                    (t.value.firstName ?? "")
                  ).replace(/(^[,\s]+)|(^[,\s]+$)/g, "") || "—"}
                </span>
              ),
              ["value.email"]: (
                <button
                  type="button"
                  className="text-secondary-600 hover:text-secondary-900 font-medium"
                  onClick={() => viewInvite(t)}
                  title="Click to view invite details"
                >
                  {t.value.email}
                  <span className="sr-only">, {t.id}</span>
                </button>
              ),
              ["value.organizationSlug"]: (
                <ViewOrganization organizationSlug={t.value.organizationSlug} />
              ),
              ["value.unitSlug"]: <ViewUnit unitSlug={t.value.unitSlug} />,
              ["value.trainingItemId"]: (
                <ViewTrainingItem trainingItemId={t.value.trainingItemId} />
              ),
              createdOn: (
                <span title={dayjs(t.createdOn).format("MMM D, YYYY h:mm A")}>
                  {dayjs(t.createdOn).fromNow()}
                </span>
              ),
              expiresOn: (
                <span title={dayjs(t.expiresOn).format("MMM D, YYYY")}>
                  {dayjs(t.expiresOn).fromNow()}
                </span>
              ),
              ["completion.progress"]: (
                <ViewPercentWatched
                  percentWatched={
                    t.completion?.progress && t.completion.progress * 100
                  }
                />
              ),
              link: (
                <button
                  type="button"
                  className="text-secondary-600 hover:text-secondary-900 font-medium"
                  onClick={() => copyTrainingUrl(t)}
                >
                  Copy Invite Link
                  <span className="sr-only">, {t.id}</span>
                </button>
              ),
              resend: (
                <button
                  type="button"
                  className="rounded-md bg-primary-500 px-2 py-1 text-center text-xs font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                  onClick={() => handleResendInvite(t)}
                >
                  Resend
                  <span className="sr-only">, {t.id}</span>
                </button>
              ),
              options: (
                <Dropdown
                  value="Open options menu"
                  valueIcon={
                    <EllipsisVerticalIcon
                      className="h-7 w-7"
                      aria-hidden="true"
                    />
                  }
                  iconOnly={true}
                  actions={[
                    {
                      id: "view",
                      value: "View",
                      action: () => viewInvite(t),
                    },
                    {
                      id: "copy-url",
                      value: "Copy Invite Link",
                      action: () => copyTrainingUrl(t),
                    },
                  ]}
                />
              ),
            })),
          }}
          isLoading={trainingInvitesLoading}
          title="View Existing Training Invites"
          subtitle="View and manage invites used to provide special access to training materials."
          action={
            <button
              type="button"
              className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              onClick={() => handleDownloadTrainingLinksCsv()}
            >
              Download (.csv)
            </button>
          }
          itemFilterQuery={itemFilterOptions}
          setItemFilterQuery={setItemFilterOptions}
          paginationOptions={{
            ...trainingInvites,
          }}
          filterOptions={{
            filters: [
              {
                key: "value.trainingItemId",
                label: "Training Item",
                many: true,
                options: trainingItems?.results.map((t) => ({
                  label: stripHtml(t.metadata.title) ?? "—",
                  value: t.id,
                })) ?? [{ value: undefined, label: "All Training Items" }],
                query: trainingItemFilterQuery.search,
                setQuery: (sq) =>
                  setTrainingItemFilterQuery((q) => {
                    q.search = sq;
                    q.limit = 10;
                  }),
                queryPlaceholder: "Search items...",
                isLoading: trainingItemsLoading,
                loadMore: () =>
                  setTrainingItemFilterQuery((q) => {
                    q.limit = +(q.limit ?? 10) + 10;
                  }),
                hasMore:
                  trainingItems && trainingItems.count > trainingItems.limit,
              },
              ...(organizationFilters.filters ?? []),
            ],
            setQuery: setItemFilterOptions,
          }}
          searchOptions={{
            searchQuery: itemFilterOptions.search ?? "",
            setSearchQuery: (sq) =>
              setItemFilterOptions((q) => {
                q.search = sq;
                q.offset = 0;
              }),
          }}
        />
      </div>
      <SlideOver
        open={manageTrainingInviteSliderOpen}
        setOpen={setManageTrainingInviteSliderOpen}
      >
        <ManageTrainingInvite
          setOpen={setManageTrainingInviteSliderOpen}
          trainingToken={selectedTrainingInvite}
          readOnly={!!selectedTrainingInvite}
        />
      </SlideOver>
    </>
  );
};

export default ManageTrainingInvites;
