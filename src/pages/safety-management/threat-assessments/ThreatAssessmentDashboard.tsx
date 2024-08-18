import { useMemo, useState } from "react";
import { LEVEL, READ, WRITE } from "../../../constants/permissions";
import { withRequirePermissions } from "../../../guards/RequirePermissions";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  SafetyManagementResourceFilterOptions,
  getThreatAssessmentStats,
  getThreatAssessments,
  saveThreatAssessment,
} from "../../../queries/safety-management";
import { AssessmentStatus } from "../../../types/entities";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import StatusPill from "./components/StatusPill";
import DataTable from "../../../components/layouts/DataTable";
import { getUnits } from "../../../queries/organizations";
import {
  ItemFilterQueryParams,
  useItemFilterQuery,
} from "../../../hooks/use-item-filter-query";
import EditableCell from "../../../components/layouts/EditableCell";
import StatsDisplay from "../../../components/StatsDisplay";
import { useAuth } from "../../../contexts/AuthProvider";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";

dayjs.extend(relativeTime);

const ThreatAssessmentDashboard: React.FC = () => {
  const location = useLocation();
  const { hasPermissions, accessTokenClaims } = useAuth();

  const {
    itemFilterOptions: tableFilterOptions,
    setItemFilterOptions: setTableFilterOptions,
  } = useItemFilterQuery({
    order: { createdOn: "DESC" },
  });

  const {
    data: assessments,
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: ["threat-assessments", tableFilterOptions],
    queryFn: ({ queryKey }) =>
      getThreatAssessments(
        queryKey[1] as SafetyManagementResourceFilterOptions
      ),
  });

  const [statsFilterOptions] = useState<SafetyManagementResourceFilterOptions>(
    {}
  );

  const { data: assessmentStats, isLoading: assessmentStatsLoading } = useQuery(
    {
      queryKey: ["threat-assessment-stats", statsFilterOptions],
      queryFn: ({ queryKey }) =>
        getThreatAssessmentStats(
          queryKey[1] as SafetyManagementResourceFilterOptions
        ),
    }
  );

  const saveAssessmentMutation = useMutation({
    mutationFn: saveThreatAssessment,
    onSuccess: () => {
      refetchAssessments();
    },
  });

  const canAlterAssessment = useMemo(
    () => hasPermissions([WRITE.THREAT_ASSESSMENTS]),
    [hasPermissions]
  );

  const hasOrganizationOrAdminLevel = useMemo(
    () =>
      hasPermissions([LEVEL.ORGANIZATION, LEVEL.ADMIN]) ||
      !!accessTokenClaims?.peer_units?.length,
    [hasPermissions]
  );

  const [unitsQuery, setUnitsQuery] = useImmer<ItemFilterQueryParams>({
    limit: 5,
  });
  const [debouncedUnitsQuery] = useDebounceValue(unitsQuery, 300);

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["units", debouncedUnitsQuery] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
    enabled: hasOrganizationOrAdminLevel,
  });

  return (
    <div className={"space-y-12"}>
      <h3 className="text-2xl font-semibold leading-6 text-gray-900">
        Threat Assessments
      </h3>

      {/* STATS */}
      <StatsDisplay
        heading="New Since"
        loading={assessmentStatsLoading}
        stats={
          assessmentStats &&
          Object.entries(assessmentStats.subtotals.newSince).map(
            ([key, subtotal]) => ({
              key: key,
              name: fromDaysKey(key),
              stat: subtotal,
              detail: `${(
                (subtotal / (assessmentStats.total || 1)) *
                100
              ).toFixed(2)}%`,
            })
          )
        }
      />

      <StatsDisplay
        heading="Totals by Status"
        loading={assessmentStatsLoading}
        stats={
          assessmentStats &&
          Object.entries(assessmentStats.subtotals.statuses).map(
            ([key, subtotal]) => ({
              key: key,
              name: <StatusPill status={key as AssessmentStatus} />,
              stat: subtotal,
              detail: `${(
                (subtotal / (assessmentStats.total || 1)) *
                100
              ).toFixed(2)}%`,
            })
          )
        }
      />

      {/* VIEW ASSESSMENTS */}
      <DataTable
        data={{
          headers: [
            {
              label: "Status",
              key: "status",
            },
            {
              label: "Tag",
              key: "tag",
            },
            {
              label: "Created On",
              key: "createdOn",
            },
            {
              label: "Last Updated",
              key: "updatedOn",
            },
            {
              label: "Unit",
              key: "unit.name",
              hidden: !hasOrganizationOrAdminLevel,
            },
            // {
            //   label: "Files",
            //   key: "pocFiles",
            //   noSort: true,
            // },
            {
              label: <span className="sr-only">View</span>,
              key: "view",
              align: "right",
              noSort: true,
            },
          ],
          rows:
            assessments?.results.map((assessment) => ({
              id: assessment.id,
              status: <StatusPill status={assessment.status} />,
              tag: (
                <EditableCell
                  value={assessment.tag}
                  onSave={(tag) =>
                    saveAssessmentMutation.mutate({
                      id: assessment.id,
                      tag,
                    })
                  }
                  emptyValue="—"
                  readOnly={!canAlterAssessment}
                />
              ),
              createdOn: dayjs(assessment.createdOn).format("MMM D, YYYY"),
              updatedOn: dayjs(assessment.updatedOn).fromNow(),
              ["unit.name"]: assessment.unit?.name ?? assessment.unit?.slug,
              // pocFiles: (
              //   <POCFilesButtonCompact pocFiles={assessment.pocFiles} />
              // ),
              view: (
                <Link
                  to={`./${assessment.id}`}
                  state={{ from: location }}
                  className="text-secondary-600 hover:text-secondary-900 font-medium"
                >
                  View
                  <span className="sr-only">, {assessment.id}</span>
                </Link>
              ),
            })) ?? [],
        }}
        isLoading={assessmentsLoading}
        notFoundDetail="No assessments found."
        title="View Assessments"
        subtitle="Sort and filter through active and closed threat assessments."
        action={
          <Link to={"./new"}>
            <button
              type="button"
              className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Start New Assessment
            </button>
          </Link>
        }
        orderOptions={{
          order: tableFilterOptions.order,
          setOrder: (k, v) => {
            setTableFilterOptions((options) => {
              options.order = { [k]: v };
              options.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: assessments?.offset ?? 0,
          total: assessments?.count ?? 0,
          limit: assessments?.limit ?? 1,

          setOffset: (offset) =>
            setTableFilterOptions((options) => ({ ...options, offset })),
        }}
        searchOptions={{
          setSearchQuery: (q) =>
            setTableFilterOptions((o) => {
              o.search = q;
              o.offset = 0;
            }),
          searchQuery: tableFilterOptions.search ?? "",
        }}
        filterOptions={{
          filters: [
            {
              key: "status",
              label: "Status",
              value: tableFilterOptions.status
                ? `${tableFilterOptions.status}`
                : undefined,
              options: Object.values(AssessmentStatus).map((status) => ({
                value: status,
                label: fromStatus(status),
              })),
            },
            {
              key: "unitSlug",
              label: "Unit",
              value: tableFilterOptions.unitSlug
                ? `${tableFilterOptions.unitSlug}`
                : undefined,
              // TODO: Dynamically get all units.
              options: units?.results.map((unit) => ({
                value: unit.slug,
                label: unit.name,
              })) ?? [{ value: undefined, label: "All schools" }],
              hidden: !hasOrganizationOrAdminLevel,
              query: unitsQuery.search,
              setQuery: (sq) =>
                setUnitsQuery((q) => {
                  q.search = sq;
                }),
              queryPlaceholder: "Find units...",
              isLoading: unitsLoading,
            },
          ],
          setFilter: (key, value) =>
            setTableFilterOptions((options) => ({
              ...options,
              [key]: options[key] === value ? undefined : value,
              offset: 0,
            })),
        }}
      />
    </div>
  );
};

export const threatAssessmentPermissionsOptions = {
  permissions: [READ.THREAT_ASSESSMENTS],
};

export default withRequirePermissions(
  ThreatAssessmentDashboard,
  threatAssessmentPermissionsOptions
);
