import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import BaseTable, { BaseTableProps } from "./BaseTable";
import { ItemFilterQueryParams } from "../../hooks/use-item-filter-query";
import { DraftFunction } from "use-immer";
import {
  asOrdering,
  asPageInfo,
  asPaginationState,
  asSortingState,
} from "../../utils/core";
import { ReactNode, useMemo } from "react";
import { Paginated } from "../../types/entities";
import FilterBar, { FilterBarFilterOptions } from "./FilterBar";
import { SearchInputProps } from "../forms/inputs/SearchInput";

interface DataTable2Props<T> extends Omit<BaseTableProps<T>, "table"> {
  data: T[];
  columns: ColumnDef<T, string>[];
  query?: ItemFilterQueryParams;
  setQuery?: (draft: DraftFunction<ItemFilterQueryParams>) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  pageState?: Partial<Omit<Paginated<unknown>, "results">>;
  searchOptions?: SearchInputProps;
  filterOptions?: FilterBarFilterOptions;
  showSearch?: boolean;
}

const DataTable2 = <T extends object>({
  data,
  columns,
  query,
  setQuery,
  className,
  title,
  subtitle,
  action,
  pageState,
  searchOptions: searchOptionsProp,
  filterOptions,
  showSearch = true,
  ...passThroughProps
}: DataTable2Props<T>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // isMultiSortEvent: () => true,
    manualSorting: true,
    state: {
      sorting:
        query &&
        Object.entries(query.order ?? {}).map(([key, value]) => ({
          id: key,
          desc: value === "DESC",
        })),
      pagination: pageState && asPaginationState(pageState),
    },
    onSortingChange: (sorting) =>
      setQuery?.((draft) => {
        const newState =
          typeof sorting === "function"
            ? sorting(asSortingState(draft.order ?? {}))
            : sorting;
        draft.order = asOrdering(newState);
      }),
    onPaginationChange: (pagination) =>
      setQuery?.((draft) => {
        const newPagination =
          typeof pagination === "function"
            ? pagination(asPaginationState(draft))
            : pagination;
        const { offset, limit } = asPageInfo(newPagination);
        draft.offset = offset;
        draft.limit = limit;
      }),
    manualPagination: true,
    rowCount: pageState?.count,
    // pageCount:
    //   pageState &&
    //   Math.floor((pageState.count ?? 0) / (pageState.limit ?? 10)) + 1,
  });

  const searchOptions = useMemo(() => {
    if (!showSearch) return;
    if (searchOptionsProp) return searchOptionsProp;
    if (query && setQuery) {
      return {
        searchQuery: query.search ?? "",
        setSearchQuery: (search) => {
          setQuery((draft) => {
            draft.search = search;
            draft.offset = 0;
          });
        },
      };
    }
  }, [showSearch, searchOptionsProp, query, setQuery]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        {(title || subtitle || action) && (
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              {title && (
                <h1 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-gray-700">{subtitle}</p>
              )}
            </div>
            {action && (
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">{action}</div>
            )}
          </div>
        )}
        {searchOptions || filterOptions ? (
          <FilterBar
            searchOptions={searchOptions}
            filterOptions={filterOptions}
          />
        ) : title || subtitle || action ? (
          <div></div>
        ) : (
          <></>
        )}
        <div className="flow-root">
          <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <BaseTable table={table} {...passThroughProps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable2;
