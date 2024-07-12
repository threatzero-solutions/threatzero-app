import { useContext, useEffect, useMemo } from "react";
import {
  findWatchStats,
  getWatchStatsCsv,
} from "../../../queries/training-admin";
import { useAuth } from "../../../contexts/AuthProvider";
import { LEVEL } from "../../../constants/permissions";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import DataTable from "../../../components/layouts/DataTable";
import { useQuery } from "@tanstack/react-query";
import { getOrganizations, getUnits } from "../../../queries/organizations";
import { CoreContext } from "../../../contexts/core/core-context";

const ViewWatchStats: React.FC = () => {
  const [watchStatsQuery, setWatchStatsQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );
  const [unitsQuery, setUnitsQuery] = useImmer<ItemFilterQueryParams>({
    limit: 100,
  });

  const { hasPermissions, accessTokenClaims } = useAuth();
  const { setInfo } = useContext(CoreContext);

  const multipleUnits = useMemo(
    () =>
      hasPermissions([LEVEL.ORGANIZATION, LEVEL.ADMIN], "any") ||
      !!accessTokenClaims?.peer_units?.length,
    [hasPermissions, accessTokenClaims]
  );

  const multipleOrganizations = useMemo(
    () => hasPermissions([LEVEL.ADMIN]),
    [hasPermissions]
  );

  const { data: watchStats, isLoading: watchStatsLoading } = useQuery({
    queryKey: ["watch-stats", watchStatsQuery],
    queryFn: () => findWatchStats(watchStatsQuery),
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: multipleOrganizations,
  });

  const { data: units } = useQuery({
    queryKey: ["units", unitsQuery] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
    enabled: multipleUnits,
  });

  useEffect(() => {
    setUnitsQuery((q) => {
      if (watchStatsQuery.organizationId) {
        q["organization.id"] = watchStatsQuery.organizationId;
      } else {
        Reflect.deleteProperty(q, "organization.id");
      }
    });
  }, [watchStatsQuery.organizationId]);

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
              key: "firstName",
              label: "First Name",
            },
            {
              key: "lastName",
              label: "Last Name",
            },
            {
              key: "email",
              label: "Email",
            },
            {
              key: "trainingItemTitle",
              label: "Training Item",
            },
            {
              key: "organizationName",
              label: "Organization",
            },
            {
              key: "unitName",
              label: "Unit",
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
          rows: (watchStats?.results ?? []).map((r, idx) => ({
            id: `${r.organizationSlug ?? idx}|${r.unitSlug ?? idx}|${
              r.email ?? idx
            }|${r.trainingItemId ?? idx}`,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            trainingItemTitle: r.trainingItemTitle,
            organizationName: r.organizationName,
            unitName: r.unitName,
            year: r.year,
            percentWatched: r.percentWatched,
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
              key: "organizationId",
              label: "Organization",
              value: watchStatsQuery.organizationId
                ? `${watchStatsQuery.organizationId}`
                : undefined,
              options: organizations?.results.map((org) => ({
                value: org.id,
                label: org.name,
              })) ?? [{ value: undefined, label: "All organizations" }],
              hidden: !multipleOrganizations,
            },
            {
              key: "unitId",
              label: "Unit",
              value: watchStatsQuery.unitId
                ? `${watchStatsQuery.unitId}`
                : undefined,
              options: units?.results.map((unit) => ({
                value: unit.id,
                label: unit.name,
              })) ?? [{ value: undefined, label: "All units" }],
              hidden: !multipleUnits,
            },
          ],
          setFilter: (key, value) =>
            setWatchStatsQuery((options) => ({
              ...options,
              [key]: options[key] === value ? undefined : value,
              offset: 0,
            })),
        }}
      />
    </>
  );
};

export default ViewWatchStats;
