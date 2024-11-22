import { useMemo, useState } from "react";
import { WRITE } from "../../../constants/permissions";
import {
  SafetyManagementResourceFilterOptions,
  getTipSubmissionStats,
  getTipSubmissions,
  saveTip,
} from "../../../queries/safety-management";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fromDaysKey, fromStatus } from "../../../utils/core";
import { Tip, TipStatus } from "../../../types/entities";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import StatusPill from "../../tip-submission/components/StatusPill";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import EditableCell from "../../../components/layouts/EditableCell";
import StatsDisplay from "../../../components/StatsDisplay";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import { safetyConcernPermissionsOptions } from "../../../constants/permission-options";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import IconButton from "../../../components/layouts/buttons/IconButton";

const columnHelper = createColumnHelper<Tip>();

const SafetyConcernsDashboard: React.FC = withRequirePermissions(() => {
  const location = useLocation();
  const {
    hasPermissions,
    hasMultipleOrganizationAccess,
    hasMultipleUnitAccess,
  } = useAuth();

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
    queryKey: ["tip-submission-stats", tipFilterOptions] as const,
    queryFn: ({ queryKey }) => getTipSubmissionStats(queryKey[1]),
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
    const columns: ColumnDef<Tip, any>[] = [];

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
                saveTipMutation.mutate({
                  id: info.row.original.id,
                  tag,
                })
              }
              emptyValue="—"
              readOnly={!canAlterTip}
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
        columnHelper.accessor((t) => t.location?.name ?? "", {
          id: "location.name",
          header: "Location",
          cell: (info) => info.getValue() || "—",
        }),
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
  }, [canAlterTip, location, saveTipMutation, hasMultipleUnitAccess]);

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
      <DataTable2
        data={tips?.results ?? []}
        columns={columns}
        isLoading={tipsLoading}
        noRowsMessage="No safety concerns found."
        title="View Safety Concerns"
        subtitle="Sort and filter through safety concern submissions."
        query={tableFilterOptions}
        setQuery={setTableFilterOptions}
        pageState={tips}
        searchOptions={{
          placeholder: "Search by tag...",
        }}
        filterOptions={{
          filters: [
            {
              key: "status",
              label: "Status",
              defaultValue: tableFilterOptions.status as string | undefined,
              options: Object.values(TipStatus).map((status) => ({
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
}, safetyConcernPermissionsOptions);

export default SafetyConcernsDashboard;
