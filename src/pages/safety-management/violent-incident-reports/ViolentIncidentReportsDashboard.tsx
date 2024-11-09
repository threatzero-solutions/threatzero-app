import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import {
  ViolentIncidentReport,
  ViolentIncidentReportStatus,
} from "../../../types/entities";
import {
  SafetyManagementResourceFilterOptions,
  getViolentIncidentReportSubmissionStats,
  getViolentIncidentReports,
  saveViolentIncidentReport,
} from "../../../queries/safety-management";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link, useLocation } from "react-router-dom";
import { WRITE } from "../../../constants/permissions";
import StatsDisplay from "../../../components/StatsDisplay";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import StatusPill from "./components/StatusPill";
import EditableCell from "../../../components/layouts/EditableCell";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { useAuth } from "../../../contexts/AuthProvider";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import { violentIncidentReportPermissionsOptions } from "../../../constants/permission-options";
import DataTable2 from "../../../components/layouts/DataTable2";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import IconButton from "../../../components/layouts/buttons/IconButton";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

dayjs.extend(relativeTime);

const columnHelper = createColumnHelper<ViolentIncidentReport>();

const ViolentIncidentReportsDashboard: React.FC = withRequirePermissions(() => {
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
    data: violentIncidentReports,
    isLoading: violentIncidentReportsLoading,
    refetch: refetchViolentIncidentReports,
  } = useQuery({
    queryKey: [
      "violent-incident-reports",
      debouncedTableFilterOptions,
    ] as const,
    queryFn: ({ queryKey }) => getViolentIncidentReports(queryKey[1]),
  });

  const [statsFilterOptions] = useState<SafetyManagementResourceFilterOptions>(
    {}
  );

  const {
    data: violentIncidentReportStats,
    isLoading: violentIncidentReportStatsLoading,
  } = useQuery({
    queryKey: ["violent-incident-report-stats", statsFilterOptions],
    queryFn: ({ queryKey }) =>
      getViolentIncidentReportSubmissionStats(
        queryKey[1] as SafetyManagementResourceFilterOptions
      ),
  });

  const saveViolentIncidentReportMutation = useMutation({
    mutationFn: saveViolentIncidentReport,
    onSuccess: () => {
      refetchViolentIncidentReports();
    },
  });

  const canAlterViolentIncidentReports = useMemo(
    () => hasPermissions([WRITE.VIOLENT_INCIDENT_REPORTS]),
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
    const columns: ColumnDef<ViolentIncidentReport, any>[] = [];

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
                saveViolentIncidentReportMutation.mutate({
                  id: info.row.original.id,
                  tag,
                })
              }
              emptyValue="—"
              readOnly={!canAlterViolentIncidentReports}
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
    canAlterViolentIncidentReports,
    location,
    saveViolentIncidentReportMutation,
    hasMultipleUnitAccess,
  ]);

  return (
    <div className={"space-y-12"}>
      <h3 className="text-2xl font-semibold leading-6 text-gray-900">
        Violent Incident Log
      </h3>

      {/* STATS */}
      <StatsDisplay
        heading="New Since"
        loading={violentIncidentReportStatsLoading}
        stats={
          violentIncidentReportStats &&
          Object.entries(violentIncidentReportStats.subtotals.newSince).map(
            ([key, subtotal]) => ({
              key: key,
              name: fromDaysKey(key),
              stat: subtotal,
              detail: `${(
                (subtotal / (violentIncidentReportStats.total || 1)) *
                100
              ).toFixed(2)}%`,
            })
          )
        }
      />

      <StatsDisplay
        heading="Totals by Status"
        loading={violentIncidentReportStatsLoading}
        stats={
          violentIncidentReportStats &&
          Object.entries(violentIncidentReportStats.subtotals.statuses).map(
            ([key, subtotal]) => ({
              key: key,
              name: <StatusPill status={key as ViolentIncidentReportStatus} />,
              stat: subtotal,
              detail: `${(
                (subtotal / (violentIncidentReportStats.total || 1)) *
                100
              ).toFixed(2)}%`,
            })
          )
        }
      />
      <DataTable2
        data={violentIncidentReports?.results ?? []}
        columns={columns}
        isLoading={violentIncidentReportsLoading}
        noRowsMessage="Violent incident log empty."
        title="Violent Incident Log"
        subtitle="View, add or edit violent incident reports."
        action={
          <Link to={"./new"}>
            <button
              type="button"
              className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Report Violent Incident
            </button>
          </Link>
        }
        query={tableFilterOptions}
        setQuery={setTableFilterOptions}
        pageState={violentIncidentReports}
        searchOptions={{
          placeholder: "Search by tag...",
        }}
        filterOptions={{
          filters: [
            {
              key: "status",
              label: "Status",
              defaultValue: tableFilterOptions.status as string | undefined,
              options: Object.values(ViolentIncidentReportStatus).map(
                (status) => ({
                  value: status,
                  label: fromStatus(status),
                })
              ),
            },
            ...(organizationFilters ?? []),
          ],
          setQuery: setTableFilterOptions,
        }}
      />
    </div>
  );
}, violentIncidentReportPermissionsOptions);

export default ViolentIncidentReportsDashboard;
