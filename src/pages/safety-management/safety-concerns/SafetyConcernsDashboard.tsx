import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import EditableCell from "../../../components/layouts/EditableCell";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import OverviewHeader from "../components/OverviewHeader";
import { safetyConcernPermissionsOptions } from "../../../constants/permission-options";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import {
  SafetyManagementResourceFilterOptions,
  getTipSubmissionStats,
  getTipSubmissions,
  saveTip,
} from "../../../queries/safety-management";
import { Tip, TipStatus } from "../../../types/entities";
import { fromStatus } from "../../../utils/core";
import StatusPill from "../../tip-submission/components/StatusPill";

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
    {},
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
    [hasPermissions],
  );

  const { filters: organizationFilters } = useOrganizationFilters({
    query: tableFilterOptions,
    setQuery: setTableFilterOptions,
    organizationsEnabled: hasMultipleOrganizationAccess,
    organizationKey: "unit.organization.slug",
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "unit.slug",
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
      ],
    );

    if (hasMultipleUnitAccess) {
      columns.push(
        columnHelper.accessor((t) => t.unit?.name ?? "", {
          id: "unit.name",
          header: "Unit",
          cell: (info) => info.getValue() || "—",
        }),
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
      ],
    );

    return columns;
  }, [canAlterTip, location, saveTipMutation, hasMultipleUnitAccess]);

  return (
    <div className={"space-y-6"}>
      <OverviewHeader
        total={tipStats?.total}
        totalContext="all-time"
        loading={tipStatsLoading}
        statusChips={
          tipStats
            ? [
                {
                  count: tipStats.subtotals.statuses.new ?? 0,
                  label: "New",
                  tone: "primary",
                  value: TipStatus.NEW,
                },
                {
                  count: tipStats.subtotals.statuses.reviewed ?? 0,
                  label: "Reviewed",
                  tone: "info",
                  value: TipStatus.REVIEWED,
                },
                {
                  count: tipStats.subtotals.statuses.resolved ?? 0,
                  label: "Resolved",
                  tone: "muted",
                  value: TipStatus.RESOLVED,
                },
              ]
            : undefined
        }
        activeStatus={tableFilterOptions.status as string | undefined}
        onStatusChange={(next) =>
          setTableFilterOptions({ ...tableFilterOptions, status: next })
        }
        trends={
          tipStats
            ? [
                {
                  count: tipStats.subtotals.newSince.days7 ?? 0,
                  label: "Last 7d",
                },
                {
                  count: tipStats.subtotals.newSince.days30 ?? 0,
                  label: "Last 30d",
                },
                {
                  count: tipStats.subtotals.newSince.days90 ?? 0,
                  label: "Last 90d",
                },
              ]
            : undefined
        }
      />

      {/* VIEW ASSESSMENTS */}
      <DataTable2
        data={tips?.results ?? []}
        columns={columns}
        isLoading={tipsLoading}
        noRowsMessage="No safety concerns found."
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
