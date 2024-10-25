import { useContext } from "react";
import { getWatchStatsCsv } from "../../../queries/training-admin";
import { useAuth } from "../../../contexts/AuthProvider";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import DataTable from "../../../components/layouts/DataTable";
import { useQuery } from "@tanstack/react-query";
import { CoreContext } from "../../../contexts/core/core-context";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import ViewPercentWatched from "./components/ViewPercentWatched";
import { stripHtml } from "../../../utils/core";
import { useDebounceValue } from "usehooks-ts";
import {
  getItemCompletions,
  getTrainingItems,
} from "../../../queries/training";
import dayjs from "dayjs";

const ViewWatchStats: React.FC = () => {
  const [watchStatsQuery, setWatchStatsQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );

  const { hasMultipleOrganizationAccess, hasMultipleUnitAccess } = useAuth();
  const { setInfo } = useContext(CoreContext);

  const { data: watchStats, isLoading: watchStatsLoading } = useQuery({
    queryKey: ["watch-stats", watchStatsQuery],
    queryFn: () => getItemCompletions(watchStatsQuery),
  });

  const [trainingItemFilterQuery, setTrainingItemFilterQuery] =
    useImmer<ItemFilterQueryParams>({ limit: 10 });
  const [debouncedTrainingItemFilterQuery] = useDebounceValue(
    trainingItemFilterQuery,
    300
  );
  const { data: trainingItems, isLoading: trainingItemsLoading } = useQuery({
    queryKey: ["training-items", debouncedTrainingItemFilterQuery] as const,
    queryFn: ({ queryKey }) => getTrainingItems(queryKey[1]),
  });

  const organizationFilters = useOrganizationFilters({
    query: watchStatsQuery,
    setQuery: setWatchStatsQuery,
    organizationsEnabled: hasMultipleOrganizationAccess,
    organizationKey: "organizationSlug",
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "unitSlug",
  });

  const handleDownloadWatchStatsCsv = () => {
    setInfo("Downloading CSV...");
    getWatchStatsCsv(watchStatsQuery).then((response) => {
      const a = document.createElement("a");
      a.setAttribute("href", window.URL.createObjectURL(new Blob([response])));
      a.setAttribute("download", "watch-stats.csv");
      document.body.append(a);
      a.click();
      a.remove();

      setTimeout(() => setInfo(), 2000);
    });
  };

  return (
    <>
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center mb-8">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          Watch Stats
        </h1>
      </div>
      <DataTable
        data={{
          headers: [
            {
              key: "lastName",
              label: "Name",
            },
            {
              key: "email",
              label: "Email",
            },
            {
              key: "organizationName",
              label: "Organization",
              hidden: !hasMultipleOrganizationAccess,
            },
            {
              key: "unitName",
              label: "Unit",
              hidden: !hasMultipleUnitAccess,
            },
            {
              key: "trainingItemTitle",
              label: "Training Item",
            },
            {
              key: "enrollment.startDate",
              label: "Year",
            },
            {
              key: "completedOn",
              label: "Completed On",
            },
            {
              key: "percentWatched",
              label: "Percent Watched",
            },
          ],
          rows: (watchStats?.results ?? []).map((r) => ({
            id: r.id,
            lastName: (
              <span className="whitespace-nowrap">
                {(
                  (r.user?.familyName ?? "") +
                  ", " +
                  (r.user?.givenName ?? "")
                ).replace(/(^[,\s]+)|(^[,\s]+$)/g, "") || "—"}
              </span>
            ),
            email: r.user?.email || "—",
            organizationName: (
              <span
                className="line-clamp-2"
                title={r.organization?.name ?? undefined}
              >
                {r.organization?.name || "—"}
              </span>
            ),
            unitName: (
              <span className="line-clamp-2" title={r.unit?.name ?? undefined}>
                {r.unit?.name || "—"}
              </span>
            ),
            trainingItemTitle: (
              <span
                className="line-clamp-2"
                title={stripHtml(r.item?.metadata.title) ?? undefined}
              >
                {stripHtml(r.item?.metadata.title) || "—"}
              </span>
            ),
            ["enrollment.startDate"]: r.enrollment?.startDate
              ? dayjs(r.enrollment?.startDate).format("YYYY")
              : "—",
            completedOn: r.completedOn
              ? dayjs(r.completedOn).format("MMM D, YYYY")
              : "—",
            percentWatched: (
              <ViewPercentWatched percentWatched={r.progress * 100} />
            ),
          })),
        }}
        title="All Training Watch Stats"
        subtitle="Sort and filter through watch stats."
        isLoading={watchStatsLoading}
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleDownloadWatchStatsCsv()}
          >
            Download (.csv)
          </button>
        }
        orderOptions={{
          order: watchStatsQuery.order,
          setOrder: (k, v) => {
            setWatchStatsQuery((options) => {
              options.order = { [k]: v };
              options.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: watchStats?.offset,
          total: watchStats?.count,
          limit: watchStats?.limit,
          setOffset: (offset) =>
            setWatchStatsQuery((q) => {
              q.offset = offset;
            }),
        }}
        filterOptions={{
          filters: [
            {
              key: "trainingItemId",
              label: "Training Item",
              many: true,
              options: trainingItems?.results.map((t) => ({
                label: stripHtml(t.metadata.title) ?? "—",
                value: t.id,
              })) ?? [{ value: undefined, label: "All Training Items" }],
              query: trainingItemFilterQuery.search,
              setQuery: (sq) =>
                setTrainingItemFilterQuery((q) => {
                  q.search = sq;
                  q.limit = 10;
                }),
              queryPlaceholder: "Search items...",
              isLoading: trainingItemsLoading,
              loadMore: () =>
                setTrainingItemFilterQuery((q) => {
                  q.limit = +(q.limit ?? 10) + 10;
                }),
              hasMore:
                trainingItems && trainingItems.count > trainingItems.limit,
            },
            ...(organizationFilters.filters ?? []),
          ],
          setQuery: setWatchStatsQuery,
        }}
      />
    </>
  );
};

export default ViewWatchStats;
