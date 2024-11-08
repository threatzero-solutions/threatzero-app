import { useContext } from "react";
import { useAuth } from "../../../contexts/AuthProvider";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import DataTable from "../../../components/layouts/DataTable";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import ViewPercentWatched from "./components/ViewPercentWatched";
import { simulateDownload, stripHtml } from "../../../utils/core";
import { useDebounceValue } from "usehooks-ts";
import {
  getItemCompletions,
  getItemCompletionsCsv,
  getTrainingItems,
} from "../../../queries/training";
import dayjs from "dayjs";
import { AlertContext } from "../../../contexts/alert/alert-context";

const ViewWatchStats: React.FC = () => {
  const [watchStatsQuery, setWatchStatsQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );

  const { hasMultipleOrganizationAccess, hasMultipleUnitAccess } = useAuth();
  const { setInfo } = useContext(AlertContext);

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

  const itemCompletionsCsvMutation = useMutation({
    mutationFn: (query: ItemFilterQueryParams) => getItemCompletionsCsv(query),
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "watch-stats.csv");
      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const handleDownloadWatchStatsCsv = () => {
    setInfo("Downloading CSV...");
    itemCompletionsCsvMutation.mutate(watchStatsQuery);
  };

  return (
    <>
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center mb-8">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          Training Completions
        </h1>
      </div>
      <DataTable
        data={{
          headers: [
            {
              key: "user.familyName",
              label: "Last Name",
            },
            {
              key: "user.givenName",
              label: "First Name",
            },
            {
              key: "user.email",
              label: "Email",
            },
            {
              key: "organization.name",
              label: "Organization",
              hidden: !hasMultipleOrganizationAccess,
            },
            {
              key: "unit.name",
              label: "Unit",
              hidden: !hasMultipleUnitAccess,
            },
            {
              key: "item.metadata.title",
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
              key: "progress",
              label: "Percent Watched",
            },
          ],
          rows: (watchStats?.results ?? []).map((r) => ({
            id: r.id,
            ["user.familyName"]: r.user?.familyName || "—",
            ["user.givenName"]: r.user?.givenName || "—",
            ["user.email"]: r.user?.email || "—",
            ["organization.name"]: (
              <span
                className="line-clamp-2"
                title={r.organization?.name ?? undefined}
              >
                {r.organization?.name || "—"}
              </span>
            ),
            ["unit.name"]: (
              <span className="line-clamp-2" title={r.unit?.name ?? undefined}>
                {r.unit?.name || "—"}
              </span>
            ),
            ["item.metadata.title"]: (
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
            progress: <ViewPercentWatched percentWatched={r.progress * 100} />,
          })),
        }}
        title="All Training Completions"
        subtitle="Sort and filter through watch stats."
        dense
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
        itemFilterQuery={watchStatsQuery}
        setItemFilterQuery={setWatchStatsQuery}
        paginationOptions={{
          ...watchStats,
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
