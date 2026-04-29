import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DraftFunction } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { Paginated } from "../../../types/entities";
import {
  asOrdering,
  asPageInfo,
  asPaginationState,
  asSortingState,
  cn,
  isNil,
} from "../../../utils/core";
import { SearchInputProps } from "../../forms/inputs/SearchInput";
import FilterBar, { FilterBarFilterOptions } from "../FilterBar";
import Paginator2 from "../Paginator2";
import BaseTable, { BaseTableProps } from "./BaseTable";
import TableHeader, { TableHeaderProps } from "./TableHeader";

interface DataTable2Props<T extends object>
  extends Omit<BaseTableProps<T>, "table">, TableHeaderProps {
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
    isMultiSortEvent: () => true,
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
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 flex-col gap-4">
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
        {/* Only the table rows + header scroll horizontally — the
            pagination footer below stays at page width and shrinks to
            fit. The negative margin lets the table bleed edge-to-edge
            on mobile; on desktop, sibling padding cancels it back out
            so the table sits flush with the rest of the card. */}
        <div className="min-w-0 flow-root">
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="sm:px-6 lg:px-8">
              <BaseTable table={table} noPaginator {...passThroughProps} />
            </div>
          </div>
        </div>
        {table.getState().pagination && (
          <Paginator2
            canPreviousPage={table.getCanPreviousPage()}
            previousPage={table.previousPage}
            canNextPage={table.getCanNextPage()}
            nextPage={table.nextPage}
            rowStart={Math.min(
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1,
              table.getRowCount(),
            )}
            rowEnd={Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getRowCount(),
            )}
            rowTotal={table.getRowCount()}
            pageCount={table.getPageCount()}
            setPageIndex={table.setPageIndex}
            pageIndex={table.getState().pagination.pageIndex}
            pageSize={table.getState().pagination.pageSize}
            setPageSize={table.setPageSize}
          />
        )}
      </div>
    </div>
  );
};

export default DataTable2;
