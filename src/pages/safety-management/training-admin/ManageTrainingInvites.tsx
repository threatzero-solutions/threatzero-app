import { useImmer } from "use-immer";
import DataTable from "../../../components/layouts/DataTable";
import {
  ResendTrainingLinksDto,
  SendTrainingLinksDto,
  TrainingParticipantRepresentation,
} from "../../../types/api";
import Input from "../../../components/forms/inputs/Input";
import { QuestionMarkCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import { SimpleChangeEvent } from "../../../types/core";
import { getTrainingCourse, getTrainingItem } from "../../../queries/training";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { useAuth } from "../../../contexts/AuthProvider";
import { LEVEL } from "../../../constants/permissions";
import { ErrorContext } from "../../../contexts/error/error-context";
import { useResolvedPath } from "react-router-dom";
import {
  getTrainingInvites,
  resendTrainingLinks,
  sendTrainingLinks,
} from "../../../queries/training-admin";
import { CoreContext } from "../../../contexts/core/core-context";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import {
  OpaqueToken,
  TrainingCourse,
  TrainingItem,
} from "../../../types/entities";
import dayjs from "dayjs";
import ManageTrainingInvite from "../../admin-panel/users/training-invites/ManageTrainingInvite";
import Dropdown from "../../../components/layouts/Dropdown";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { getUnitBySlug } from "../../../queries/organizations";
import { stripHtml } from "../../../utils/core";
import CourseSelect from "../../../components/forms/inputs/CourseSelect";
import Autocomplete from "../../../components/forms/inputs/Autocomplete";

const CSV_HEADERS_MAPPER = new Map([
  ["firstname", "firstName"],
  ["lastname", "lastName"],
  ["email", "email"],
  ["givenname", "firstName"],
  ["familyname", "lastName"],
  ["emailaddress", "email"],
  ["surname", "lastName"],
  ["unit", "unitSlug"],
  ["school", "unitSlug"],
  ["course", "trainingCourseId"],
  ["courseid", "trainingCourseId"],
  ["trainingcourseid", "trainingCourseId"],
  ["item", "trainingItemId"],
  ["trainingitem", "trainingItemId"],
  ["trainingitemid", "trainingItemId"],
]);

const normalizeHeaders = (headers: string[]) => {
  return headers.map(
    (h) =>
      CSV_HEADERS_MAPPER.get(h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()) || h
  );
};

const ViewTrainingItem: React.FC<{ trainingItemId?: string }> = ({
  trainingItemId,
}) => {
  const { data: trainingItemMetadata, isLoading } = useQuery({
    queryKey: ["training-item-metadata", trainingItemId] as const,
    queryFn: ({ queryKey }) =>
      getTrainingItem(queryKey[1]).then((t) => t?.metadata ?? null),
    enabled: !!trainingItemId,
  });
  return isLoading ? (
    <div className="animate-pulse rounded bg-slate-200 w-full h-6" />
  ) : (
    <span>
      {trainingItemMetadata ? (
        stripHtml(trainingItemMetadata.title)
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
    <span>{unitName ? unitName : "—"}</span>
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
  const [selectedCourse, setSelectedCourse] = useState<
    TrainingCourse | undefined | null
  >();
  const [selectedItem, setSelectedItem] = useState<
    TrainingItem | undefined | null
  >();
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [manageTrainingInviteSliderOpen, setManageTrainingInviteSliderOpen] =
    useState(false);
  const [selectedTrainingInvite, setSelectedTrainingInvite] =
    useState<OpaqueToken>();

  const { hasPermissions, accessTokenClaims } = useAuth();
  const { setError } = useContext(ErrorContext);
  const { setSuccess } = useContext(CoreContext);

  const watchTrainingPath = useResolvedPath("/watch-training/");

  const [itemFilterOptions, setItemFilterOptions] =
    useImmer<ItemFilterQueryParams>({});

  const { data: trainingInvites, isLoading: trainingInvitesLoading } = useQuery(
    {
      queryKey: ["training-invites", itemFilterOptions] as const,
      queryFn: ({ queryKey }) => getTrainingInvites(queryKey[1]),
    }
  );

  const multipleUnits = useMemo(
    () =>
      hasPermissions([LEVEL.ORGANIZATION, LEVEL.ADMIN], "any") ||
      !!accessTokenClaims?.peer_units?.length,
    [hasPermissions, accessTokenClaims]
  );

  useEffect(() => {
    console.debug(selectedCourse);
  }, [selectedCourse]);

  const { data: allTrainingItems } = useQuery({
    queryKey: ["training-course-items", selectedCourse] as const,
    queryFn: ({ queryKey }) =>
      getTrainingCourse(queryKey[1]?.id).then((c) =>
        c?.sections.reduce((arr, s) => {
          arr.push(...(s.items?.map((i) => i.item) ?? []));
          return arr;
        }, [] as TrainingItem[])
      ),
    enabled: !!selectedCourse,
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

  const handleCSVUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (!text || typeof text !== "string") {
        return;
      }
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const headers = normalizeHeaders(lines.shift()?.split(",") || []);
      setTokenValues(() =>
        lines.map((line) => {
          const {
            firstName,
            lastName,
            email,
            unitSlug,
            trainingCourseId: _trainingCourseId,
            trainingItemId: _trainingItemId,
          } = Object.fromEntries(
            headers.map((h, i) => [h, line.split(",")[i]])
          );

          if (!selectedCourse && _trainingCourseId) {
            getTrainingCourse(_trainingCourseId).then((c) => {
              setSelectedCourse(c);

              if (!selectedItem && _trainingItemId) {
                setSelectedItem(
                  c?.sections.reduce((acc, s) => {
                    if (!acc) {
                      acc = s.items
                        ?.map((i) => i.item)
                        .find((i) => i.id === _trainingItemId);
                    }

                    return acc;
                  }, undefined as TrainingItem | undefined)
                );
              }
            });
          }

          return {
            firstName,
            lastName,
            email,
            unitSlug,
          };
        })
      );
    };
    reader.readAsText(file);
  };

  const handleUpdateInvite = (
    idx: number,
    key: keyof Omit<TrainingParticipantRepresentation, "audiences">,
    e: SimpleChangeEvent<string>
  ) => {
    setTokenValues((draft) => {
      let value = e.target?.value;
      if (key === "unitSlug" && value && typeof value !== "string") {
        value = (value as any).slug;
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
      setSuccess("Invites successfully sent!", 5000);
      setTokenValues([{ firstName: "", lastName: "", email: "" }]);
      setSelectedCourse(undefined);
      setSelectedItem(undefined);
      queryClient.invalidateQueries({ queryKey: ["training-invites"] });
    },
  });

  const resendTrainingLinkMutation = useMutation({
    mutationFn: (body: ResendTrainingLinksDto) => resendTrainingLinks(body),
    onSuccess: () => {
      setSuccess("Invite successfully resent!", 5000);
    },
  });

  const onSubmitSendInvites = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedCourse) {
      setError("No training course selected.", 5000);
      return;
    }

    if (!selectedItem) {
      setError("No training item selected.", 5000);
      return;
    }

    const preparedRequest: SendTrainingLinksDto = {
      trainingTokenValues: tokenValues.map((t) => ({
        ...t,
        userId: t.email,
      })),
      trainingUrlTemplate: `${window.location.origin}${watchTrainingPath.pathname}{trainingItemId}?watchId={token}`,
      trainingCourseId: selectedCourse?.id,
      trainingItemId: selectedItem?.id,
    };

    sendTrainingLinksMutation.mutate(preparedRequest);
  };

  const copyTrainingUrl = (token: OpaqueToken) => {
    const url = `${window.location.origin}${watchTrainingPath.pathname}${token.value.trainingItemId}?watchId=${token.key}`;
    navigator.clipboard.writeText(url);
    setSuccess("Copied training link to clipboard", 5000);
  };

  const viewInvite = (token: OpaqueToken) => {
    setSelectedTrainingInvite(token);
    setManageTrainingInviteSliderOpen(true);
  };

  const handleResendInvite = (token: OpaqueToken) => {
    resendTrainingLinkMutation.mutate({
      trainingTokenIds: [token.id],
      trainingUrlTemplate: `${window.location.origin}${watchTrainingPath.pathname}{trainingItemId}?watchId={token}`,
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
        <form className="flex flex-col gap-6" onSubmit={onSubmitSendInvites}>
          {/* SEND NEW INVITES */}
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
                  hidden: !multipleUnits,
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
                    value={t.unitSlug}
                    onChange={(e) =>
                      handleUpdateInvite(
                        idx,
                        "unitSlug",
                        e as SimpleChangeEvent<string>
                      )
                    }
                    required={true}
                  />
                ),
                delete: (
                  <button type="button" onClick={() => handleDeleteInvite(idx)}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                ),
              })),
            }}
            title="Send New Invites"
            subtitle="Send members of your organization email invites to watch specific trainings."
            action={
              <label className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600">
                + Upload From CSV
                <input
                  type="file"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            }
          />
          <button
            type="button"
            className="w-max self-center text-base text-secondary-600 hover:text-secondary-700 transition-colors"
            onClick={() => handleAddInvite()}
          >
            + Add Invite
          </button>
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Select a training course
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <CourseSelect
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target?.value)}
                immediate
                required
              />
            </div>
          </div>{" "}
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
              />
            </div>
          </div>
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
          data={{
            headers: [
              {
                label: "Name",
                key: "lastName",
              },
              {
                label: "Email",
                key: "email",
              },
              {
                label: "Unit",
                key: "unitSlug",
              },
              {
                label: "Training Item",
                key: "trainingItemId",
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
              lastName: (
                <span className="whitespace-nowrap">
                  {(
                    (t.value.lastName ?? "") +
                    ", " +
                    (t.value.firstName ?? "")
                  ).replace(/(^[,\s]+)|(^[,\s]+$)/g, "") || "—"}
                </span>
              ),
              email: (
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
              unitSlug: <ViewUnit unitSlug={t.value.unitSlug} />,
              trainingItemId: (
                <ViewTrainingItem trainingItemId={t.value.trainingItemId} />
              ),
              createdOn: (
                <span title={dayjs(t.createdOn).format("MMM D, YYYY h:mm A")}>
                  {dayjs(t.createdOn).fromNow()}
                </span>
              ),
              expiresOn: (
                <span title={dayjs(t.value.expiresOn).format("MMM D, YYYY")}>
                  {dayjs(t.value.expiresOn).fromNow()}
                </span>
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
          orderOptions={{
            order: itemFilterOptions.order,
            setOrder: (k, v) => {
              setItemFilterOptions((options) => {
                options.order = { [k]: v };
                options.offset = 0;
              });
            },
          }}
          paginationOptions={{
            currentOffset: trainingInvites?.offset,
            total: trainingInvites?.count,
            limit: trainingInvites?.limit,
            setOffset: (offset) =>
              setItemFilterOptions((q) => {
                q.offset = offset;
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
