import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../hooks/use-organization-filters";
import {
  getItemCompletions,
  getItemCompletionsCsv,
  getTrainingItems,
} from "../../../queries/training";
import { ItemCompletion } from "../../../types/entities";
import { simulateDownload, stripHtml } from "../../../utils/core";
import ViewPercentWatched from "./components/ViewPercentWatched";

const columnHelper = createColumnHelper<ItemCompletion>();

const ViewWatchStats: React.FC = () => {
  const [completionsQuery, setCompletionsQuery] =
    useImmer<ItemFilterQueryParams>({ order: { ["user.familyName"]: "DESC" } });

  const { hasMultipleOrganizationAccess, hasMultipleUnitAccess } = useAuth();
  const { setInfo, clearAlert } = useContext(AlertContext);
  const infoAlertId = useAlertId();

  const [debouncedCompletionsQuery] = useDebounceValue(completionsQuery, 300);
  const { data: itemCompletions, isLoading: completionsLoading } = useQuery({
    queryKey: ["item-completions", debouncedCompletionsQuery],
    queryFn: () => getItemCompletions(debouncedCompletionsQuery),
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

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: ColumnDef<ItemCompletion, any>[] = [];

    columns.push(
      ...[
        columnHelper.accessor((c) => c.user?.familyName ?? "", {
          id: "user.familyName",
          header: "Last Name",
          cell: (info) => info.getValue() || "—",
        }),
        columnHelper.accessor((c) => c.user?.givenName ?? "", {
          id: "user.givenName",
          header: "First Name",
          cell: (info) => info.getValue() || "—",
        }),
        columnHelper.accessor((c) => c.user?.email ?? "", {
          id: "user.email",
          header: "Email",
          cell: (info) => info.getValue() || "—",
        }),
      ]
    );

    if (hasMultipleOrganizationAccess) {
      columns.push(
        columnHelper.accessor((c) => c.user?.organization?.name ?? "", {
          id: "user.organization.name",
          header: "Organization",
          cell: (info) => (
            <span className="line-clamp-2" title={info.getValue() || undefined}>
              {info.getValue() || "—"}
            </span>
          ),
        })
      );
    }

    if (hasMultipleUnitAccess) {
      columns.push(
        columnHelper.accessor((c) => c.user?.unit?.name ?? "", {
          id: "user.unit.name",
          header: "Unit",
          cell: (info) => (
            <span className="line-clamp-2" title={info.getValue() || undefined}>
              {info.getValue() || "—"}
            </span>
          ),
        })
      );
    }

    columns.push(
      ...[
        columnHelper.accessor("item.metadata.title", {
          id: "item.metadata.title",
          header: "Training Item",
          cell: (info) => {
            const strippedValue = stripHtml(info.getValue() ?? "");
            return (
              <span className="line-clamp-2" title={strippedValue || undefined}>
                {strippedValue || "—"}
              </span>
            );
          },
        }),
        columnHelper.accessor("enrollment.startDate", {
          id: "enrollment.startDate",
          header: "Year",
          cell: (info) =>
            dayjs(info.getValue()).isValid()
              ? dayjs(info.getValue()).format("YYYY")
              : "—",
        }),
        columnHelper.accessor((c) => c.completedOn ?? "", {
          id: "completedOn",
          header: "Completed On",
          cell: (info) =>
            dayjs(info.getValue()).isValid()
              ? dayjs(info.getValue()).format("ll")
              : "—",
        }),
        columnHelper.accessor("progress", {
          header: "Percent Watched",
          cell: (info) => (
            <ViewPercentWatched percentWatched={info.getValue() * 100} />
          ),
        }),
      ]
    );

    return columns;
  }, [hasMultipleOrganizationAccess, hasMultipleUnitAccess]);

  const organizationFilters = useOrganizationFilters({
    query: completionsQuery,
    setQuery: setCompletionsQuery,
    organizationsEnabled: hasMultipleOrganizationAccess,
    organizationKey: "user.organization.slug",
    unitsEnabled: hasMultipleUnitAccess,
    unitKey: "user.unit.slug",
  });

  const itemCompletionsCsvMutation = useMutation({
    mutationFn: (query: ItemFilterQueryParams) => getItemCompletionsCsv(query),
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "watch-stats.csv");
      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const handleDownloadWatchStatsCsv = () => {
    setInfo("Downloading CSV...", { id: infoAlertId });
    itemCompletionsCsvMutation.mutate(completionsQuery);
  };

  return (
    <>
      {/* <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center mb-8">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          View Completions
        </h1>
      </div> */}
      <DataTable2
        data={itemCompletions?.results ?? []}
        columns={columns}
        title="All Training Progress & Completion"
        subtitle="Sort and filter through watch stats."
        dense
        isLoading={completionsLoading}
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleDownloadWatchStatsCsv()}
          >
            Download (.csv)
          </button>
        }
        query={completionsQuery}
        setQuery={setCompletionsQuery}
        pageState={itemCompletions}
        searchOptions={{
          placeholder: "Search by user...",
        }}
        filterOptions={{
          filters: [
            {
              key: "item.id",
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
          setQuery: setCompletionsQuery,
        }}
        showFooter={false}
      />
    </>
  );
};

export default ViewWatchStats;
