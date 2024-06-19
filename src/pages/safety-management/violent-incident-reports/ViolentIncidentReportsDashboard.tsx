import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import DataTable from "../../../components/layouts/DataTable";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import { ViolentIncidentReportStatus } from "../../../types/entities";
import {
  SafetyManagementResourceFilterOptions,
  getViolentIncidentReportSubmissionStats,
  getViolentIncidentReports,
  saveViolentIncidentReport,
} from "../../../queries/safety-management";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link, useLocation } from "react-router-dom";
import { LEVEL, READ, WRITE } from "../../../constants/permissions";
import { getUnits } from "../../../queries/organizations";
import StatsDisplay from "../../../components/StatsDisplay";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import StatusPill from "./components/StatusPill";
import EditableCell from "../../../components/layouts/EditableCell";
import { withRequirePermissions } from "../../../guards/RequirePermissions";
import { useAuth } from "../../../contexts/AuthProvider";

dayjs.extend(relativeTime);

const ViolentIncidentReportsDashboard: React.FC = () => {
  const location = useLocation();
  const { hasPermissions, accessTokenClaims } = useAuth();

  const {
    itemFilterOptions: tableFilterOptions,
    setItemFilterOptions: setTableFilterOptions,
  } = useItemFilterQuery({
    order: { createdOn: "DESC" },
  });

  const {
    data: violentIncidentReports,
    isLoading: violentIncidentReportsLoading,
    refetch: refetchViolentIncidentReports,
  } = useQuery({
    queryKey: ["violent-incident-reports", tableFilterOptions],
    queryFn: ({ queryKey }) =>
      getViolentIncidentReports(
        queryKey[1] as SafetyManagementResourceFilterOptions
      ),
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

  const hasOrganizationOrAdminLevel = useMemo(
    () =>
      hasPermissions([LEVEL.ORGANIZATION, LEVEL.ADMIN]) ||
      !!accessTokenClaims?.peer_units?.length,
    [hasPermissions]
  );

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: () => getUnits({ limit: 100 }),
    enabled: hasOrganizationOrAdminLevel,
  });

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
          rows: (violentIncidentReports?.results ?? []).map((report) => ({
            id: report.id,
            status: <StatusPill status={report.status} />,
            tag: (
              <EditableCell
                value={report.tag}
                onSave={(tag) =>
                  saveViolentIncidentReportMutation.mutate({
                    id: report.id,
                    tag,
                  })
                }
                emptyValue="—"
                readOnly={!canAlterViolentIncidentReports}
              />
            ),
            createdOn: dayjs(report.createdOn).format("MMM D, YYYY"),
            updatedOn: dayjs(report.updatedOn).fromNow(),
            ["unit.name"]: report.unit?.name ?? report.unit?.slug,
            // pocFiles: <POCFilesButtonCompact pocFiles={report.pocFiles} />,
            view: (
              <Link
                to={`./${report.id}`}
                state={{ from: location }}
                className="text-secondary-600 hover:text-secondary-900 font-medium"
              >
                View
                <span className="sr-only">, {report.id}</span>
              </Link>
            ),
          })),
        }}
        isLoading={violentIncidentReportsLoading}
        notFoundDetail="Violent incident log empty."
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
        orderOptions={{
          order: tableFilterOptions.order,
          setOrder: (k, v) => {
            setTableFilterOptions((q) => {
              q.order = { [k]: v };
              q.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: violentIncidentReports?.offset,
          total: violentIncidentReports?.count,
          limit: violentIncidentReports?.limit,
          setOffset: (offset) =>
            setTableFilterOptions((q) => {
              q.offset = offset;
            }),
        }}
        searchOptions={{
          searchQuery: tableFilterOptions.search ?? "",
          setSearchQuery: (search) => {
            setTableFilterOptions((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
        filterOptions={{
          filters: [
            {
              key: "status",
              label: "Status",
              value: tableFilterOptions.status
                ? `${tableFilterOptions.status}`
                : undefined,
              options: Object.values(ViolentIncidentReportStatus).map(
                (status) => ({
                  value: status,
                  label: fromStatus(status),
                })
              ),
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

export const violentIncidentReportPermissionsOptions = {
  permissions: [READ.VIOLENT_INCIDENT_REPORTS],
};

export default withRequirePermissions(
  ViolentIncidentReportsDashboard,
  violentIncidentReportPermissionsOptions
);
