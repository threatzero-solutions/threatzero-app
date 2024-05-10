import { useContext, useMemo, useState } from "react";
import { LEVEL, READ, WRITE } from "../../../constants/permissions";
import {
  SafetyManagementResourceFilterOptions,
  getTipSubmissionStats,
  getTipSubmissions,
  saveTip,
} from "../../../queries/safety-management";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import { TipStatus } from "../../../types/entities";
import DataTable from "../../../components/layouts/DataTable";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import StatusPill from "../../tip-submission/components/StatusPill";
import { getLocations, getUnits } from "../../../queries/organizations";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import EditableCell from "../../../components/layouts/EditableCell";
import { CoreContext } from "../../../contexts/core/core-context";
import StatsDisplay from "../../../components/StatsDisplay";
import { withRequirePermissions } from "../../../guards/RequirePermissions";

const DEFAULT_PAGE_SIZE = 10;

const SafetyConcernsDashboard: React.FC = () => {
  const location = useLocation();
  const { hasPermissions, accessTokenClaims } = useContext(CoreContext);

  const {
    itemFilterOptions: tableFilterOptions,
    debouncedItemFilterOptions: debouncedTableFilterOptions,
    setItemFilterOptions: setTableFilterOptions,
  } = useItemFilterQuery({
    order: { createdOn: "DESC" },
  });

  const {
    data: tips,
    isLoading: tipsLoading,
    refetch: refetchTips,
  } = useQuery({
    queryKey: ["tip-submissions", debouncedTableFilterOptions] as const,
    queryFn: ({ queryKey }) => getTipSubmissions(queryKey[1]),
  });

  const [tipFilterOptions] = useState<SafetyManagementResourceFilterOptions>(
    {}
  );
  const { data: tipStats, isLoading: tipStatsLoading } = useQuery({
    queryKey: ["tip-submission-stats", tipFilterOptions],
    queryFn: ({ queryKey }) =>
      getTipSubmissionStats(
        queryKey[1] as SafetyManagementResourceFilterOptions
      ),
  });

  const saveTipMutation = useMutation({
    mutationFn: saveTip,
    onSuccess: () => {
      refetchTips();
    },
  });

  const canAlterTip = useMemo(
    () => hasPermissions([WRITE.TIPS]),
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

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getLocations({ limit: 100 }),
  });

  return (
    <div className={"space-y-12"}>
      <h3 className="text-2xl font-semibold leading-6 text-gray-900">
        Safety Concerns
      </h3>

      {/* STATS */}
      <StatsDisplay
        heading="New Since"
        loading={tipStatsLoading}
        stats={
          tipStats &&
          Object.entries(tipStats.subtotals.newSince).map(
            ([key, subtotal]) => ({
              key: key,
              name: fromDaysKey(key),
              stat: subtotal,
              detail: `${((subtotal / (tipStats.total || 1)) * 100).toFixed(
                2
              )}%`,
            })
          )
        }
      />

      <StatsDisplay
        heading="Totals by Status"
        loading={tipStatsLoading}
        stats={
          tipStats &&
          Object.entries(tipStats.subtotals.statuses).map(
            ([key, subtotal]) => ({
              key: key,
              name: <StatusPill status={key as TipStatus} />,
              stat: subtotal,
              detail: `${((subtotal / (tipStats.total || 1)) * 100).toFixed(
                2
              )}%`,
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
            {
              label: "Location",
              key: "location.name",
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
            tips?.results.map((tip) => ({
              id: tip.id,
              status: <StatusPill status={tip.status} />,
              tag: (
                <EditableCell
                  value={tip.tag}
                  onSave={(tag) =>
                    saveTipMutation.mutate({
                      id: tip.id,
                      tag,
                    })
                  }
                  emptyValue="—"
                  readOnly={!canAlterTip}
                />
              ),
              createdOn: dayjs(tip.createdOn).format("MMM D, YYYY"),
              updatedOn: dayjs(tip.updatedOn).fromNow(),
              ["unit.name"]: tip.unit?.name ?? "—",
              ["location.name"]: tip.location?.name ?? "—",
              // pocFiles: <POCFilesButtonCompact pocFiles={tip.pocFiles} />,
              view: (
                <Link
                  to={`./${tip.id}`}
                  state={{ from: location }}
                  className="text-secondary-600 hover:text-secondary-900 font-medium"
                >
                  View
                  <span className="sr-only">, {tip.id}</span>
                </Link>
              ),
            })) ?? [],
        }}
        isLoading={tipsLoading}
        notFoundDetail="No safety concerns found."
        title="View Safety Concerns"
        subtitle="Sort and filter through safety concern submissions."
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
          currentOffset: tips?.offset ?? 0,
          pageSize: DEFAULT_PAGE_SIZE,
          total: tips?.count ?? 0,
          limit: tips?.limit ?? 1,

          setOffset: (offset) =>
            setTableFilterOptions((options) => {
              options.offset = offset;
            }),
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
              options: Object.values(TipStatus).map((status) => ({
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
              })) ?? [{ value: undefined, label: "All units" }],
              hidden: !hasOrganizationOrAdminLevel,
            },
            {
              key: "location.id",
              label: "Location",
              value: tableFilterOptions["location.id"]
                ? `${tableFilterOptions["location.id"]}`
                : undefined,
              // TODO: Dynamically get all units.
              options: locations?.results.map((locations) => ({
                value: locations.id,
                label: locations.name,
              })) ?? [{ value: undefined, label: "All locations" }],
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

export const safetyConcernPermissionsOptions = {
  permissions: [READ.TIPS],
};

export default withRequirePermissions(
  SafetyConcernsDashboard,
  safetyConcernPermissionsOptions
);
