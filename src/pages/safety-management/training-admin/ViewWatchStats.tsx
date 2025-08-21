import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue, useLocalStorage } from "usehooks-ts";
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";
import Modal from "../../../components/layouts/modal/Modal";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import {
  getLatestCourseEnrollments,
  getMyOrganization,
  getNextEnrollment,
  getOrganization,
  getPreviousEnrollment,
  getRelativeEnrollment,
} from "../../../queries/organizations";
import {
  getItemCompletions,
  getItemCompletionsCsv,
  getItemCompletionsSummary,
  getTrainingCourse,
} from "../../../queries/training";
import {
  CourseEnrollment,
  ItemCompletion,
  Organization,
  TrainingCourse,
} from "../../../types/entities";
import {
  RelativeEnrollmentDto,
  SectionAndWindow,
} from "../../../types/training";
import { cn, isNil, simulateDownload, stripHtml } from "../../../utils/core";
import {
  getLatestAvailableSectionWithPreviousAndNext,
  getSectionAndWindowBySectionIdWithPreviousAndNext,
} from "../../../utils/training";
import TrainingSectionTile from "../../training-library/components/TrainingSectionTile";
import TrainingPicker from "./components/training-picker/TrainingPicker";
import ViewPercentWatched from "./components/ViewPercentWatched";

const columnHelper = createColumnHelper<ItemCompletion>();

const ViewWatchStats: React.FC = () => {
  const { hasMultipleOrganizationAccess, hasMultipleUnitAccess } = useAuth();
  const { setInfo, clearAlert } = useContext(AlertContext);
  const infoAlertId = useAlertId();

  const [selectedOrganizationId, setSelectedOrganizationId] = useLocalStorage<
    string | undefined
  >("training-report-selected-organization-id", undefined);
  const { data: organization, isLoading: organizationLoading } = useQuery({
    queryKey: ["organization", selectedOrganizationId] as const,
    queryFn: async ({ queryKey }) => {
      if (queryKey[1]) {
        try {
          return await getOrganization(queryKey[1]);
        } catch (e) {
          console.warn(`Failed to get organization by id: ${queryKey[1]}`, e);
        }
      }

      return await getMyOrganization();
    },
    refetchOnWindowFocus: false,
  });
  const [changingOrganization, setChangingOrganization] = useState(false);

  const {
    data: defaultReportInputData,
    isLoading: defaultReportInputDataLoading,
    isPending: defaultReportInputDataPending,
  } = useQuery({
    queryKey: ["default-report-input-data", organization?.id] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1]
        ? getDefaultReportInputData(queryKey[1])
        : Promise.resolve(null),
    enabled: !!organization,
    refetchOnWindowFocus: false,
  });

  const [reportInputData, setReportInputData] = useImmer<
    ReportInputData | undefined
  >(undefined);

  useEffect(() => {
    if (defaultReportInputData) {
      setReportInputData(defaultReportInputData);
    }
  }, [defaultReportInputData, setReportInputData]);

  const { mutate: updateReportInputDataMutate } = useMutation({
    mutationFn: (newData: UpdateReportInputData) =>
      updateReportInputData(reportInputData, newData),
    onSuccess: (data) => {
      setReportInputData((draft) => ({ ...draft, ...data }));
    },
  });

  const {
    mutate: setPreviousEnrollment,
    isPending: isPreviousEnrollmentLoading,
  } = useMutation({
    mutationFn: async (enrollmentId: string) => {
      if (!organization) return null;
      return await getAdjacentEnrollmentAndUpdateReportInputData(
        organization.id,
        enrollmentId,
        true,
        reportInputData
      );
    },
    onSuccess: (data) => {
      data && setReportInputData((draft) => ({ ...draft, ...data }));
    },
  });

  const { mutate: setNextEnrollment, isPending: isNextEnrollmentLoading } =
    useMutation({
      mutationFn: async (enrollmentId: string) => {
        if (!organization) return null;
        return await getAdjacentEnrollmentAndUpdateReportInputData(
          organization.id,
          enrollmentId,
          false,
          reportInputData
        );
      },
      onSuccess: (data) => {
        data && setReportInputData((draft) => ({ ...draft, ...data }));
      },
    });

  const [trainingPickerOpen, setTrainingPickerOpen] = useState(false);

  const [tableFiltersQuery, setTableFiltersQuery] =
    useImmer<ItemFilterQueryParams>({
      order: { progress: "ASC" },
    });
  const [debouncedTableFiltersQuery] = useDebounceValue(tableFiltersQuery, 300);

  const itemCompletionsPreviewAndSummaryQuery = {
    ["user.organization.id"]: selectedOrganizationId,
    ["enrollment.id"]: reportInputData?.relativeEnrollment?.id,
    ["item.id"]: reportInputData?.trainingSectionAndWindow?.section?.items?.map(
      (i) => i.item.id
    ),
  };

  const itemCompletionsQuery = {
    ...debouncedTableFiltersQuery,
    ...itemCompletionsPreviewAndSummaryQuery,
  };

  const {
    data: itemCompletionsSummary,
    isPending: itemCompletionsSummaryPending,
  } = useQuery({
    queryKey: [
      "item-completions-summary",
      itemCompletionsPreviewAndSummaryQuery,
    ] as const,
    queryFn: ({ queryKey }) => getItemCompletionsSummary(queryKey[1]),
    enabled:
      !!selectedOrganizationId && !!reportInputData?.relativeEnrollment?.id,
  });

  const summaryPercentComplete = itemCompletionsSummary
    ? (itemCompletionsSummary.totalComplete /
        (itemCompletionsSummary.totalComplete +
          itemCompletionsSummary.totalIncomplete)) *
      100
    : 0;

  const {
    data: itemCompletions,
    isLoading: completionsLoading,
    isPending: completionsPending,
  } = useQuery({
    queryKey: ["item-completions", itemCompletionsQuery] as const,
    queryFn: ({ queryKey }) => getItemCompletions(queryKey[1]),
    enabled:
      !!selectedOrganizationId && !!reportInputData?.relativeEnrollment?.id,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor((c) => c.user?.familyName ?? "", {
        id: "user.familyName",
        header: "Last Name",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor((c) => c.user?.givenName ?? "", {
        id: "user.givenName",
        header: "First Name",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor((c) => c.user?.email ?? "", {
        id: "user.email",
        header: "Email",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor((c) => c.user?.unit?.name ?? "", {
        id: "user.unit.name",
        header: "Unit",
        cell: (info) => (
          <span className="line-clamp-2" title={info.getValue() || undefined}>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("item.metadata.title", {
        id: "item.metadata.title",
        header: "Training Item",
        cell: (info) => {
          const strippedValue = stripHtml(info.getValue() ?? "");
          return (
            <span className="line-clamp-2" title={strippedValue || undefined}>
              {strippedValue || "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("enrollment.startDate", {
        id: "enrollment.startDate",
        header: "Year",
        cell: (info) =>
          dayjs(info.getValue()).isValid()
            ? dayjs(info.getValue()).format("YYYY")
            : "—",
      }),
      columnHelper.accessor((c) => c.completedOn ?? "", {
        id: "completedOn",
        header: "Completed On",
        cell: (info) =>
          dayjs(info.getValue()).isValid()
            ? dayjs(info.getValue()).format("ll")
            : "—",
      }),
      columnHelper.accessor("progress", {
        header: "Percent Watched",
        cell: (info) => (
          <ViewPercentWatched percentWatched={info.getValue() * 100} />
        ),
      }),
    ],
    []
  );

  const organizationFilters = useOrganizationFilters({
    query: tableFiltersQuery,
    setQuery: setTableFiltersQuery,
    organizationsEnabled: false,
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "user.unit.slug",
  });

  const reportDownloadFilename = useMemo(() => {
    const stripHtmlAndTruncate = (
      str: string | undefined | null,
      length: number
    ) =>
      isNil(str)
        ? undefined
        : stripHtml(str)
            .substring(0, length)
            .replace(/[^\w]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "")
            .replace(/_+/g, "_");

    return (
      [
        "completion_report",
        stripHtmlAndTruncate(
          reportInputData?.trainingCourse?.metadata.title,
          15
        ),
        stripHtmlAndTruncate(
          reportInputData?.trainingSectionAndWindow?.section?.metadata.title ||
            reportInputData?.trainingSectionAndWindow?.section?.items?.at(0)
              ?.item.metadata.title,
          15
        ),
        dayjs(reportInputData?.relativeEnrollment?.startDate).format(
          "YYYY_MM_DD"
        ),
        dayjs(reportInputData?.relativeEnrollment?.endDate).format(
          "YYYY_MM_DD"
        ),
      ]
        .filter(Boolean)
        .join("-") + ".csv"
    );
  }, [reportInputData]);

  const itemCompletionsCsvMutation = useMutation({
    mutationFn: (query: ItemFilterQueryParams) => getItemCompletionsCsv(query),
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), reportDownloadFilename);
      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const handleDownloadWatchStatsCsv = () => {
    setInfo("Downloading CSV...", { id: infoAlertId });
    itemCompletionsCsvMutation.mutate(itemCompletionsQuery);
  };

  return (
    <>
      <div className="border-b border-gray-200 pb-5 flex flex-col gap-1 mb-4">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          Generate Training Completion Report
        </h1>
        <p className="text-sm text-gray-500">
          This tool allows you to view training completion details for a
          specific training section and enrollment period for{" "}
          {hasMultipleOrganizationAccess
            ? "an organization"
            : "your organization"}
          .
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] content-center gap-x-8 gap-y-6 mb-8">
        <ol className="text-sm text-gray-500 col-span-full list-decimal list-inside">
          <li>
            Begin by selecting{" "}
            {hasMultipleOrganizationAccess ? "an organization and" : ""} a
            training section.
          </li>
          <li>
            Then, you can preview the results in the table below or download
            them as a CSV file.
          </li>
        </ol>
        {hasMultipleOrganizationAccess && (
          <>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Organization
            </label>
            <div className="mt-2 sm:mt-0 flex flex-col items-start">
              {changingOrganization ? (
                <>
                  <OrganizationSelect
                    value={undefined}
                    onChange={(e) => {
                      setSelectedOrganizationId(
                        e.target
                          ? typeof e.target.value === "string"
                            ? e.target.value
                            : (e.target.value as Organization).id
                          : undefined
                      );
                      setChangingOrganization(false);
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="text-xs text-secondary-600 hover:text-secondary-500 transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-default"
                    onClick={() => setChangingOrganization(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {organizationLoading ? (
                    <div className="animate-pulse rounded-md bg-slate-200 h-5 w-32 my-1 shadow-sm" />
                  ) : (
                    <span onClick={() => setChangingOrganization(true)}>
                      {organization?.name}
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-xs text-secondary-600 hover:text-secondary-500 transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-default"
                    onClick={() => setChangingOrganization(true)}
                  >
                    Change Organization
                  </button>
                </>
              )}
            </div>
          </>
        )}

        <label className="block text-sm font-medium leading-6 text-gray-900">
          Training
        </label>
        {defaultReportInputDataPending ? (
          <div className="animate-pulse rounded-md bg-slate-200 h-54 w-full shadow-sm" />
        ) : reportInputData?.relativeEnrollment === null ? (
          <div className="text-gray-500 text-xs flex items-center grow">
            No training enrollments found.
          </div>
        ) : (
          <div
            className={cn(
              "mt-2 sm:mt-0 flex flex-col items-stretch gap-2",
              defaultReportInputDataLoading &&
                "animate-pulse pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-md py-1 px-2 bg-secondary-600 text-white text-xs">
                Course
              </div>
              {stripHtml(
                reportInputData?.trainingCourse?.metadata.title ?? "Unknown"
              )}
            </div>
            {reportInputData?.trainingSectionAndWindow?.section ? (
              <div className="relative">
                <TrainingSectionTile
                  featuredWindow={
                    reportInputData.trainingSectionAndWindow.window
                  }
                  section={reportInputData.trainingSectionAndWindow.section}
                  navigateDisabled
                  dense
                />
                <FloatingChevron
                  direction="left"
                  hidden={!reportInputData.previousTrainingSectionAndWindow}
                  onClick={() =>
                    reportInputData.previousTrainingSectionAndWindow &&
                    updateReportInputDataMutate({
                      trainingSectionAndWindow:
                        reportInputData.previousTrainingSectionAndWindow,
                    })
                  }
                />
                <FloatingChevron
                  direction="right"
                  hidden={!reportInputData.nextTrainingSectionAndWindow}
                  onClick={() =>
                    reportInputData.nextTrainingSectionAndWindow &&
                    updateReportInputDataMutate({
                      trainingSectionAndWindow:
                        reportInputData.nextTrainingSectionAndWindow,
                    })
                  }
                />
              </div>
            ) : (
              <>&mdash;</>
            )}
            <div className="flex items-center gap-2 text-secondary-600 text-xs">
              <button
                type="button"
                className="hover:text-secondary-500 transition-colors cursor-pointer"
                onClick={() => setTrainingPickerOpen(true)}
              >
                Change Training
              </button>
              <span>|</span>
              <button
                type="button"
                className="hover:text-secondary-500 transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-default"
                disabled={
                  !reportInputData?.relativeEnrollment ||
                  reportInputData.relativeEnrollment.isEarliest ||
                  isPreviousEnrollmentLoading
                }
                onClick={() =>
                  reportInputData?.relativeEnrollment &&
                  setPreviousEnrollment(reportInputData.relativeEnrollment.id)
                }
              >
                Previous Enrollment Period
              </button>
              <span>|</span>
              <button
                type="button"
                className="hover:text-secondary-500 transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-default"
                disabled={
                  !reportInputData?.relativeEnrollment ||
                  reportInputData.relativeEnrollment.isLatest ||
                  isNextEnrollmentLoading
                }
                onClick={() =>
                  reportInputData?.relativeEnrollment &&
                  setNextEnrollment(reportInputData.relativeEnrollment.id)
                }
              >
                Next Enrollment Period
              </button>
            </div>
          </div>
        )}

        <label className="block text-sm font-medium leading-6 text-gray-900">
          Summary
        </label>
        {itemCompletionsSummaryPending ? (
          <div className="animate-pulse rounded-md bg-slate-200 h-5 w-64 my-2 shadow-sm" />
        ) : itemCompletionsSummary ? (
          <div className="flex flex-col gap-2">
            <div className="grid gap-1">
              <div className="text-xs text-gray-600 font-semibold">
                Total Completion: {summaryPercentComplete.toFixed(0)}% (
                {itemCompletionsSummary.totalComplete}/
                {itemCompletionsSummary.totalComplete +
                  itemCompletionsSummary.totalIncomplete}
                )
              </div>
              <div className="relative rounded-md h-3 w-full bg-gray-200 overflow-hidden">
                <div
                  className={cn(
                    "absolute top-0 left-0 bottom-0 rounded-md",
                    summaryPercentComplete > 85
                      ? "bg-green-500"
                      : summaryPercentComplete > 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  )}
                  style={{
                    width: `${summaryPercentComplete}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <DataTable2
        data={itemCompletions?.results ?? []}
        columns={columns}
        dense
        title="Preview Completion Report"
        subtitle="Sort and filter through completion progress for each user."
        isLoading={
          reportInputData?.relativeEnrollment !== null &&
          (completionsLoading || completionsPending)
        }
        noRowsMessage={
          reportInputData?.relativeEnrollment !== null
            ? "No completion data for the given query."
            : "No training enrollments found."
        }
        columnVisibility={{
          "user.unit.name": !!hasMultipleUnitAccess,
          "item.metadata.title":
            (reportInputData?.trainingSectionAndWindow?.section?.items
              ?.length ?? 0) > 1,
        }}
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleDownloadWatchStatsCsv()}
          >
            Download Report (.csv)
          </button>
        }
        query={tableFiltersQuery}
        setQuery={setTableFiltersQuery}
        pageState={itemCompletions}
        searchOptions={{
          placeholder: "Search by user...",
        }}
        filterOptions={{
          filters: [
            {
              key: "completed",
              label: "Completion Status",
              many: false,
              options: [
                {
                  label: "Complete",
                  value: "1",
                },
                {
                  label: "Incomplete",
                  value: "",
                },
              ],
            },
            ...(organizationFilters.filters ?? []),
          ],
          setQuery: setTableFiltersQuery,
        }}
        showFooter={false}
      />
      {organization && (
        <TrainingPickerModal
          organizationId={organization?.id}
          open={trainingPickerOpen}
          setOpen={setTrainingPickerOpen}
          onChangeTrainingData={({ courseEnrollment, sectionAndWindow }) => {
            updateReportInputDataMutate({
              relativeEnrollment: courseEnrollment,
              trainingSectionAndWindow: sectionAndWindow,
            });
          }}
        />
      )}
    </>
  );
};

export default ViewWatchStats;

function TrainingPickerModal({
  organizationId,
  open,
  setOpen,
  onChangeTrainingData,
}: {
  organizationId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChangeTrainingData: (data: {
    courseEnrollment: CourseEnrollment;
    sectionAndWindow: SectionAndWindow;
  }) => void;
}) {
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      classNames={{ dialogPanel: "w-full sm:max-w-2xl" }}
    >
      <div className="bg-white px-4 py-4 sm:py-6 rounded-lg h-[32rem] w-full overflow-hidden">
        <TrainingPicker
          organizationId={organizationId}
          onChangeTrainingData={(data) => {
            onChangeTrainingData(data);
            setOpen(false);
          }}
        />
      </div>
    </Modal>
  );
}

function FloatingChevron({
  direction,
  onClick,
  hidden,
}: {
  direction: "left" | "right";
  onClick: () => void;
  hidden?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute top-3 p-1 rounded-full opacity-100 bg-white/80 backdrop-blur-lg drop-shadow-sm cursor-pointer hover:bg-white/90 hover:drop-shadow-md transition-all text-secondary-600",
        direction === "left" ? "left-3" : "right-3",
        hidden && "opacity-0"
      )}
    >
      {direction === "left" ? (
        <ChevronLeftIcon className="size-6" />
      ) : (
        <ChevronRightIcon className="size-6" />
      )}
    </div>
  );
}

interface ReportInputData {
  organizationId: string;
  relativeEnrollment: RelativeEnrollmentDto | null;
  trainingCourse: TrainingCourse | null;
  trainingSectionAndWindow: SectionAndWindow | null;
  nextTrainingSectionAndWindow: SectionAndWindow | null;
  previousTrainingSectionAndWindow: SectionAndWindow | null;
}

type UpdateReportInputData = Partial<
  Omit<ReportInputData, "relativeEnrollment"> & {
    relativeEnrollment: RelativeEnrollmentDto | CourseEnrollment | null;
  }
>;

const getDefaultReportInputData = async (organizationId: string) => {
  const returnInputData: ReportInputData = {
    organizationId,
    relativeEnrollment: null,
    trainingCourse: null,
    trainingSectionAndWindow: null,
    nextTrainingSectionAndWindow: null,
    previousTrainingSectionAndWindow: null,
  };

  // Try to get the default enrollment from local storage.
  const defaultEnrollmentId = localStorage.getItem(
    getDefaultEnrollmentStorageKey(organizationId)
  );

  if (defaultEnrollmentId) {
    try {
      returnInputData.relativeEnrollment = await getRelativeEnrollment(
        organizationId,
        defaultEnrollmentId
      );
    } catch (e) {
      console.warn(
        `Failed to get relative enrollment by id: ${defaultEnrollmentId}`,
        e
      );
      returnInputData.relativeEnrollment = null;
    }
  }

  // If no default enrollment is found (or local storage ID is invalid), try to get the latest enrollment.
  if (!returnInputData.relativeEnrollment) {
    const latestEnrollmentId = await getLatestCourseEnrollments(
      organizationId
    ).then((e) => e.at(0)?.id);
    if (latestEnrollmentId) {
      returnInputData.relativeEnrollment = await getRelativeEnrollment(
        organizationId,
        latestEnrollmentId
      );
    }
  }

  if (!returnInputData.relativeEnrollment) {
    return returnInputData;
  }

  // Get the training course for the default enrollment.
  const trainingCourse = await getTrainingCourse(
    returnInputData.relativeEnrollment.courseId
  );

  if (!trainingCourse) {
    return returnInputData;
  }
  returnInputData.trainingCourse = trainingCourse;

  // Try to get the default section from local storage.
  const defaultSectionId = localStorage.getItem(
    getDefaultSectionStorageKey(
      organizationId,
      returnInputData.relativeEnrollment.courseId
    )
  );

  if (defaultSectionId) {
    const { previous, matching, next } =
      getSectionAndWindowBySectionIdWithPreviousAndNext(
        defaultSectionId,
        returnInputData.relativeEnrollment,
        trainingCourse.sections
      );
    returnInputData.trainingSectionAndWindow = matching;
    returnInputData.previousTrainingSectionAndWindow = previous;
    returnInputData.nextTrainingSectionAndWindow = next;
  }

  // If no default section is found (or local storage ID is invalid), get the latest available section.
  if (!returnInputData.trainingSectionAndWindow) {
    const { previous, latest, next } =
      getLatestAvailableSectionWithPreviousAndNext(
        returnInputData.relativeEnrollment,
        trainingCourse.sections
      );
    returnInputData.previousTrainingSectionAndWindow = previous;
    returnInputData.trainingSectionAndWindow = latest;
    returnInputData.nextTrainingSectionAndWindow = next;
  }

  return returnInputData;
};

const updateReportInputData = async (
  reportInputData: ReportInputData | undefined,
  newData: UpdateReportInputData
) => {
  const draft: UpdateReportInputData = { ...newData };

  if (!reportInputData) {
    if (!draft.organizationId) {
      return;
    }
    return await getDefaultReportInputData(draft.organizationId);
  }

  const isEqual = <
    K extends keyof UpdateReportInputData,
    T extends UpdateReportInputData,
    J extends UpdateReportInputData
  >(
    key: K,
    objA: T,
    objB: J
  ) => {
    const a = objA[key];
    const b = objB[key];

    if (isNil(a) && isNil(b)) {
      return true;
    }

    if (
      typeof a === "object" &&
      a !== null &&
      typeof b === "object" &&
      b !== null
    ) {
      if ("id" in a && "id" in b) {
        return a.id === b.id;
      } else if ("section" in a && "section" in b) {
        return (
          a.section.id === b.section.id &&
          a.window?.featuredOn === b.window?.featuredOn &&
          a.window?.featuredUntil === b.window?.featuredUntil
        );
      }
    } else if (typeof a === typeof b) {
      return a === b;
    }
    return false;
  };

  const updated = <
    T extends UpdateReportInputData,
    K extends keyof UpdateReportInputData
  >(
    object: T,
    key: K
  ): object is T & Record<K, NonNullable<T[K]>> => {
    return !isNil(object[key]) && !isEqual(key, reportInputData, object);
  };

  // If organization changes, we need to get a new default course enrollment (unless an enrollment is provided).
  if (updated(draft, "organizationId") && !newData.relativeEnrollment) {
    const latestEnrollments = await getLatestCourseEnrollments(
      draft.organizationId
    );
    const latestEnrollment = latestEnrollments.at(1);

    if (latestEnrollment) {
      draft.relativeEnrollment =
        (await getRelativeEnrollment(
          draft.organizationId,
          latestEnrollment.id
        )) ?? undefined;
    }
  }

  // If the passed in enrollment isn't the correct type, we need to convert it to the correct type.
  if (
    reportInputData?.organizationId &&
    draft.relativeEnrollment &&
    !("courseId" in draft.relativeEnrollment)
  ) {
    draft.relativeEnrollment =
      (await getRelativeEnrollment(
        reportInputData.organizationId,
        draft.relativeEnrollment.id
      )) ?? undefined;
  }

  // If the enrollment gets updated with a different training course, we need to fetch a new training
  // course (unless a training course is provided).
  if (
    updated(draft, "relativeEnrollment") &&
    "courseId" in draft.relativeEnrollment &&
    !newData.trainingCourse &&
    reportInputData.trainingCourse?.id !== draft.relativeEnrollment.courseId
  ) {
    draft.trainingCourse =
      (await getTrainingCourse(draft.relativeEnrollment.courseId)) ?? undefined;
  }

  // If the enrollment gets updated but no new section and window is provided, we need to get a new section
  // window based on the new enrollment.
  if (
    updated(draft, "relativeEnrollment") &&
    !newData.trainingSectionAndWindow &&
    reportInputData.trainingSectionAndWindow?.section
  ) {
    const { previous, matching, next } =
      getSectionAndWindowBySectionIdWithPreviousAndNext(
        reportInputData.trainingSectionAndWindow.section.id,
        draft.relativeEnrollment ?? reportInputData?.relativeEnrollment,
        draft.trainingCourse?.sections ??
          reportInputData.trainingCourse?.sections ??
          []
      );
    draft.trainingSectionAndWindow = matching;
    draft.previousTrainingSectionAndWindow = previous;
    draft.nextTrainingSectionAndWindow = next;
  }

  // If the training course gets updated but no new section and window is provided, we need to get a new section
  // window based on the new training course.
  if (updated(draft, "trainingCourse") && !newData.trainingSectionAndWindow) {
    const { previous, latest, next } =
      getLatestAvailableSectionWithPreviousAndNext(
        draft.relativeEnrollment ??
          reportInputData?.relativeEnrollment ??
          undefined,
        draft.trainingCourse.sections
      );
    draft.trainingSectionAndWindow = latest;
    draft.previousTrainingSectionAndWindow = previous;
    draft.nextTrainingSectionAndWindow = next;
  }

  if (updated(draft, "relativeEnrollment")) {
    localStorage.setItem(
      getDefaultEnrollmentStorageKey(
        draft.organizationId ??
          reportInputData?.organizationId ??
          "unknown-organization"
      ),
      draft.relativeEnrollment.id
    );
  }

  if (updated(draft, "trainingSectionAndWindow")) {
    localStorage.setItem(
      getDefaultSectionStorageKey(
        draft.organizationId ??
          reportInputData?.organizationId ??
          "unknown-organization",
        draft.trainingCourse?.id ??
          reportInputData?.trainingCourse?.id ??
          "unknown-course"
      ),
      draft.trainingSectionAndWindow.section.id
    );

    const activeRelativeEnrollment =
      draft.relativeEnrollment ?? reportInputData?.relativeEnrollment;

    if (activeRelativeEnrollment) {
      const { previous, next } =
        getSectionAndWindowBySectionIdWithPreviousAndNext(
          draft.trainingSectionAndWindow.section.id,
          activeRelativeEnrollment,
          draft.trainingCourse?.sections ??
            reportInputData.trainingCourse?.sections ??
            []
        );
      draft.previousTrainingSectionAndWindow = previous;
      draft.nextTrainingSectionAndWindow = next;
    }
  }

  return draft;
};

const getAdjacentEnrollmentAndUpdateReportInputData = async (
  organizationId: string,
  enrollmentId: string,
  isPrevious: boolean,
  reportInputData: ReportInputData | undefined
) => {
  const fn = isPrevious ? getPreviousEnrollment : getNextEnrollment;
  const previousEnrollment = await fn(organizationId, enrollmentId);
  if (!previousEnrollment) return null;
  return await updateReportInputData(reportInputData, {
    relativeEnrollment: previousEnrollment,
  });
};

const getDefaultEnrollmentStorageKey = (organizationId: string) =>
  `training-report-default-enrollment-${organizationId}`;

const getDefaultSectionStorageKey = (
  organizationId: string,
  courseId: string
) => `training-report-default-section-${organizationId}-${courseId}`;
