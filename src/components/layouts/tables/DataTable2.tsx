import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import BaseTable, { BaseTableProps } from "./BaseTable";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { DraftFunction } from "use-immer";
import {
  asOrdering,
  asPageInfo,
  asPaginationState,
  asSortingState,
  isNil,
} from "../../../utils/core";
import { useMemo } from "react";
import { Paginated } from "../../../types/entities";
import FilterBar, { FilterBarFilterOptions } from "../FilterBar";
import { SearchInputProps } from "../../forms/inputs/SearchInput";
import TableHeader, { TableHeaderProps } from "./TableHeader";

interface DataTable2Props<T extends object>
  extends Omit<BaseTableProps<T>, "table">,
    TableHeaderProps {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  query?: ItemFilterQueryParams;
  setQuery?: (draft: DraftFunction<ItemFilterQueryParams>) => void;
  className?: string;
  pageState?: Partial<Omit<Paginated<unknown>, "results">>;
  searchOptions?: Partial<SearchInputProps>;
  filterOptions?: FilterBarFilterOptions;
  showSearch?: boolean;
  columnVisibility?: VisibilityState;
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
  columnVisibility,
  ...passThroughProps
}: DataTable2Props<T>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // isMultiSortEvent: () => true,
    manualSorting: true,
    state: {
      sorting: query && asSortingState(query.order ?? {}),
      pagination: pageState && asPaginationState(pageState),
      columnVisibility,
    },
    onSortingChange: (sorting) =>
      setQuery?.((draft) => {
        const newState =
          typeof sorting === "function"
            ? sorting(asSortingState(draft.order ?? {}))
            : sorting;
        draft.order = asOrdering(newState);
        draft.offset = 0;
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
  });

  const searchOptions = useMemo(() => {
    if (!showSearch) return;

    const opts: Partial<SearchInputProps> = {};

    if (query && setQuery) {
      opts.searchQuery = query.search ?? "";
      opts.setSearchQuery = (search) => {
        setQuery((draft) => {
          draft.search = search;
          draft.offset = 0;
        });
      };
    }

    if (searchOptionsProp) {
      Object.assign(opts, searchOptionsProp);
    }

    if (!isNil(opts.searchQuery) && opts.setSearchQuery) {
      return opts as SearchInputProps;
    }
  }, [showSearch, searchOptionsProp, query, setQuery]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        {(title || subtitle || action) && (
          <TableHeader title={title} subtitle={subtitle} action={action} />
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
