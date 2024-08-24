import { useContext } from "react";
import {
  findWatchStats,
  getWatchStatsCsv,
} from "../../../queries/training-admin";
import { useAuth } from "../../../contexts/AuthProvider";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import DataTable from "../../../components/layouts/DataTable";
import { useQuery } from "@tanstack/react-query";
import { CoreContext } from "../../../contexts/core/core-context";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import ViewPercentWatched from "./components/ViewPercentWatched";
import { dedup, stripHtml } from "../../../utils/core";

const ViewWatchStats: React.FC = () => {
  const [watchStatsQuery, setWatchStatsQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );

  const { hasMultipleOrganizationAccess, hasMultipleUnitAccess } = useAuth();
  const { setInfo } = useContext(CoreContext);

  const { data: watchStats, isLoading: watchStatsLoading } = useQuery({
    queryKey: ["watch-stats", watchStatsQuery],
    queryFn: () => findWatchStats(watchStatsQuery),
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
              key: "year",
              label: "Year",
            },
            {
              key: "percentWatched",
              label: "Percent Watched",
            },
          ],
          rows: dedup(
            (watchStats?.results ?? []).map((r) => ({
              ...r,
              id: `${r.organizationSlug}|${r.unitSlug}|${r.userExternalId}|${r.trainingItemId}|${r.year}|${r.percentWatched}`,
            })),
            (r) => r.id
          ).map((r) => ({
            id: r.id,
            lastName: (
              <span className="whitespace-nowrap">
                {((r.lastName ?? "") + ", " + (r.firstName ?? "")).replace(
                  /(^[,\s]+)|(^[,\s]+$)/g,
                  ""
                ) || "—"}
              </span>
            ),
            email: r.email || "—",
            organizationName: (
              <span
                className="line-clamp-2"
                title={r.organizationName ?? undefined}
              >
                {r.organizationName || "—"}
              </span>
            ),
            unitName: (
              <span className="line-clamp-2" title={r.unitName ?? undefined}>
                {r.unitName || "—"}
              </span>
            ),
            trainingItemTitle: (
              <span
                className="line-clamp-2"
                title={stripHtml(r.trainingItemTitle) ?? undefined}
              >
                {stripHtml(r.trainingItemTitle) || "—"}
              </span>
            ),
            year: r.year,
            percentWatched: (
              <ViewPercentWatched percentWatched={r.percentWatched} />
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
        filterOptions={organizationFilters}
      />
    </>
  );
};

export default ViewWatchStats;
