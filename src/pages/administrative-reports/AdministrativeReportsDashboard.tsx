import { useState } from "react";
import { READ } from "../../constants/permissions";
import {
  RequirePermissionsOptions,
  withRequirePermissions,
} from "../../guards/RequirePermissions";
import {
  TipSubmissionFilterOptions,
  getTipSubmissionStats,
  getTipSubmissions,
} from "../../queries/tips";
import { useQuery } from "@tanstack/react-query";
import { classNames, fromDaysKey, fromStatus } from "../../utils/core";
import { TipStatus } from "../../types/entities";
import DataTable, {
  useDataTableFilterOptions,
} from "../../components/layouts/DataTable";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import StatusPill from "../tip-submission/components/StatusPill";
import { getUnits } from "../../queries/organizations";

const DEFAULT_PAGE_SIZE = 10;
// const AUDIENCE_COLORS = ["#050505", "#004FFF", "#31AFD4", "#902D41", "#FF007F"];

const AdministrativeReportsDashboard: React.FC = () => {
  const location = useLocation();

  const { tableFilterOptions, setTableFilterOptions } =
    useDataTableFilterOptions({
      order: { createdOn: "DESC" },
    });

  const { data: tips, isLoading: tipsLoading } = useQuery({
    queryKey: ["tip-submissions", tableFilterOptions],
    queryFn: ({ queryKey }) =>
      getTipSubmissions(queryKey[1] as TipSubmissionFilterOptions),
  });

  const [tipFilterOptions] = useState<TipSubmissionFilterOptions>({});
  const { data: tipStats } = useQuery({
    queryKey: ["tip-submission-stats", tipFilterOptions],
    queryFn: ({ queryKey }) =>
      getTipSubmissionStats(queryKey[1] as TipSubmissionFilterOptions),
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: () => getUnits({ limit: 100 }),
  });

  return (
    <div className={"space-y-12"}>
      {/* STATS */}
      {tipStats ? (
        <div>
          <h3 className="text-2xl font-semibold leading-6 text-gray-900 mb-4">
            Safety Concerns
          </h3>
          <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 shadow-md">
            {Object.entries(tipStats.subtotals.newSince).map(
              ([key, subtotal]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
                >
                  <dt className="text-sm font-medium leading-6 text-gray-500">
                    New {fromDaysKey(key)}
                  </dt>
                  <dd
                    className={classNames(
                      "text-gray-700",
                      "text-xs font-medium"
                    )}
                  >
                    {((subtotal / tipStats.total) * 100).toFixed(2)}%
                  </dd>
                  <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                    {subtotal}
                  </dd>
                </div>
              )
            )}
          </dl>
        </div>
      ) : (
        <div className="w-full">
          <div className="animate-pulse flex-1">
            <div className="h-36 bg-slate-200 rounded" />
          </div>
        </div>
      )}
      {tipStats ? (
        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
            Totals by Status
          </h3>
          <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 shadow-md">
            {Object.entries(tipStats.subtotals.statuses).map(
              ([key, subtotal]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
                >
                  <dt className="text-sm font-medium leading-6 text-gray-500">
                    <StatusPill status={key as TipStatus} />
                  </dt>
                  <dd
                    className={classNames(
                      "text-gray-700",
                      "text-xs font-medium"
                    )}
                  >
                    {((subtotal / (tipStats.total ?? 1)) * 100).toFixed(2)}%
                  </dd>
                  <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                    {subtotal}
                  </dd>
                </div>
              )
            )}
          </dl>
        </div>
      ) : (
        <div className="w-full">
          <div className="animate-pulse flex-1">
            <div className="h-36 bg-slate-200 rounded" />
          </div>
        </div>
      )}

      {/* VIEW ASSESSMENTS */}
      <DataTable
        data={{
          headers: [
            {
              label: "Status",
              key: "status",
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
              key: "unit",
            },
            {
              label: <span className="sr-only">View</span>,
              key: "view",
              align: "right",
            },
          ],
          rows:
            tips?.results.map((tip) => ({
              id: tip.id,
              status: <StatusPill status={tip.status} />,
              createdOn: dayjs(tip.createdOn).format("MMM D, YYYY"),
              updatedOn: dayjs(tip.updatedOn).fromNow(),
              unit: tip.unit?.name ?? tip.unit?.slug,
              view: (
                <Link
                  to={`./safety-concerns/${tip.id}`}
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
              options: units?.results.map((unit) => ({
                value: unit.slug,
                label: unit.name,
              })) ?? [{ value: undefined, label: "All units" }],
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

export const administrativeReportsDashboardPermissionsOptions: RequirePermissionsOptions =
  {
    permissions: [READ.TIPS],
    type: "all",
  };

export default withRequirePermissions(
  AdministrativeReportsDashboard,
  administrativeReportsDashboardPermissionsOptions
);
