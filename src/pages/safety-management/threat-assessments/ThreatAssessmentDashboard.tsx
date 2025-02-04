import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import EditableCell from "../../../components/layouts/EditableCell";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import StatsDisplay from "../../../components/StatsDisplay";
import { threatAssessmentPermissionsOptions } from "../../../constants/permission-options";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import {
  SafetyManagementResourceFilterOptions,
  getThreatAssessmentStats,
  getThreatAssessments,
  saveThreatAssessment,
} from "../../../queries/safety-management";
import { AssessmentStatus, ThreatAssessment } from "../../../types/entities";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import StatusPill from "./components/StatusPill";

dayjs.extend(relativeTime);

const columnHelper = createColumnHelper<ThreatAssessment>();

const ThreatAssessmentDashboard: React.FC = withRequirePermissions(() => {
  const location = useLocation();
  const {
    hasPermissions,
    hasMultipleOrganizationAccess,
    hasMultipleUnitAccess,
  } = useAuth();

  const {
    itemFilterOptions: tableFilterOptions,
    setItemFilterOptions: setTableFilterOptions,
    debouncedItemFilterOptions: debouncedTableFilterOptions,
  } = useItemFilterQuery({
    order: { createdOn: "DESC" },
  });

  const {
    data: assessments,
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: ["threat-assessments", debouncedTableFilterOptions] as const,
    queryFn: ({ queryKey }) => getThreatAssessments(queryKey[1]),
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

  const { filters: organizationFilters } = useOrganizationFilters({
    query: tableFilterOptions,
    setQuery: setTableFilterOptions,
    organizationsEnabled: hasMultipleOrganizationAccess,
    organizationKey: "unit.organization.slug",
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "unitSlug",
    locationKey: "location.id",
  });

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: ColumnDef<ThreatAssessment, any>[] = [];

    columns.push(
      ...[
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => <StatusPill status={info.getValue()} />,
        }),
        columnHelper.accessor("tag", {
          header: "Tag",
          cell: (info) => (
            <EditableCell
              value={info.getValue()}
              onSave={(tag) =>
                saveAssessmentMutation.mutate({
                  id: info.row.original.id,
                  tag,
                })
              }
              emptyValue="—"
              readOnly={!canAlterAssessment}
            />
          ),
        }),
        columnHelper.accessor("createdOn", {
          header: "Created On",
          cell: (info) => dayjs(info.getValue()).format("ll"),
        }),
        columnHelper.accessor("updatedOn", {
          header: "Last Updated",
          cell: (info) => dayjs(info.getValue()).fromNow(),
        }),
      ]
    );

    if (hasMultipleUnitAccess) {
      columns.push(
        columnHelper.accessor((t) => t.unit?.name ?? "", {
          id: "unit.name",
          header: "Unit",
          cell: (info) => info.getValue() || "—",
        })
      );
    }

    columns.push(
      ...[
        // columnHelper.accessor('pocFiles', {
        //   header: "Files",
        //   cell: (info) => <POCFilesButtonCompact pocFiles={info.getValue()} />,
        //   enableSorting: false,
        // }),
        columnHelper.display({
          id: "actions",
          cell: (info) => (
            <ButtonGroup>
              <IconButton
                as={Link}
                to={`./${info.row.original.id}`}
                state={{ from: location }}
                className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
                icon={ArrowRightIcon}
                trailing
                text="View"
              />
            </ButtonGroup>
          ),
          enableSorting: false,
        }),
      ]
    );

    return columns;
  }, [
    canAlterAssessment,
    location,
    saveAssessmentMutation,
    hasMultipleUnitAccess,
  ]);

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
      <DataTable2
        data={assessments?.results ?? []}
        columns={columns}
        isLoading={assessmentsLoading}
        noRowsMessage="No assessments found."
        title="View Assessments"
        subtitle="Sort and filter through active and closed threat assessments."
        action={
          <Link to={"./new"}>
            <button
              type="button"
              className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Start New Assessment
            </button>
          </Link>
        }
        query={tableFilterOptions}
        setQuery={setTableFilterOptions}
        pageState={assessments}
        searchOptions={{
          placeholder: "Search by tag...",
        }}
        filterOptions={{
          filters: [
            {
              key: "status",
              label: "Status",
              defaultValue: tableFilterOptions.status as string | undefined,
              options: Object.values(AssessmentStatus).map((status) => ({
                value: status,
                label: fromStatus(status),
              })),
            },
            ...(organizationFilters ?? []),
          ],
          setQuery: setTableFilterOptions,
        }}
        showFooter={false}
      />
    </div>
  );
}, threatAssessmentPermissionsOptions);

export default ThreatAssessmentDashboard;
