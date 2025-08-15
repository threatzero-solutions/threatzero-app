import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import {
  Cell,
  flexRender,
  Header,
  Row,
  type Table,
} from "@tanstack/react-table";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { classNames, cn } from "../../../utils/core";
import Paginator2 from "../Paginator2";

export interface BaseTableProps<T> {
  table: Table<T>;
  dense?: boolean;
  isLoading?: boolean;
  noRowsMessage?: string;
  showFooter?: boolean;
}

const BaseTable = <T extends object>({
  table,
  dense = false,
  isLoading = false,
  noRowsMessage = "No results.",
  showFooter = true,
}: BaseTableProps<T>) => {
  return (
    <>
      <table
        style={{
          width: table.options.enableColumnResizing
            ? table.getCenterTotalSize()
            : undefined,
        }}
        className="min-w-full divide-y divide-gray-300 table-auto"
      >
        <BaseTableHeader table={table} />
        <BaseTableBody
          table={table}
          dense={dense}
          isLoading={isLoading}
          noRowsMessage={noRowsMessage}
        >
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell, idx) => (
                <BaseTableCell
                  key={cell.id}
                  table={table}
                  row={row}
                  cell={cell}
                  idx={idx}
                  dense={dense}
                />
              ))}
            </tr>
          ))}
        </BaseTableBody>
        {showFooter && (
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={classNames(
                      "py-3.5 text-sm text-left font-semibold text-gray-900 px-2",
                      idx === 0
                        ? "pl-4 pr-3 sm:pl-0"
                        : idx === footerGroup.headers.length - 1
                        ? "pl-3 pr-4 sm:pl-0"
                        : "px-2"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
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
            table.getRowCount()
          )}
          rowEnd={Math.min(
            table.getState().pagination.pageIndex +
              1 * table.getState().pagination.pageSize,
            table.getRowCount()
          )}
          rowTotal={table.getRowCount()}
          pageCount={table.getPageCount()}
          setPageIndex={table.setPageIndex}
          pageIndex={table.getState().pagination.pageIndex}
        />
      )}
    </>
  );
};

export default BaseTable;

export function BaseTableHeader<T extends object>({
  table,
  className,
  dense = false,
}: {
  table: Table<T>;
  className?: string;
  dense?: boolean;
}) {
  return (
    <thead className={cn(className)}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header, idx) => (
            <BaseTableHeaderCell
              key={header.id}
              table={table}
              header={header}
              idx={idx}
              headersCount={headerGroup.headers.length}
              dense={dense}
            />
          ))}
        </tr>
      ))}
    </thead>
  );
}

export function BaseTableHeaderCell<T extends object>({
  table,
  header,
  idx,
  dense = false,
  headersCount,
  style,
  className,
}: {
  table: Table<T>;
  header: Header<T, unknown>;
  idx: number;
  dense?: boolean;
  headersCount: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <th
      key={header.id}
      style={{
        width: table.options.enableColumnResizing
          ? header.getSize()
          : undefined,
        ...style,
      }}
      className={cn(
        dense ? "py-1.5 text-xs" : "py-3.5 text-sm",
        "relative text-left font-semibold text-gray-900",
        idx === 0
          ? dense
            ? "pl-2.5 pr-1.5 sm:pl-0"
            : "pl-4 pr-3 sm:pl-0"
          : idx === headersCount - 1
          ? dense
            ? "pl-1.5 pr-2.5 sm:pl-0"
            : "pl-3 pr-4 sm:pl-0"
          : dense
          ? "px-1.5"
          : "px-2",
        className
      )}
    >
      {header.isPlaceholder ? null : (
        <div
          className={classNames(
            "whitespace-nowrap group inline-flex",
            header.column.getCanSort() ? "cursor-pointer" : ""
          )}
          onClick={header.column.getToggleSortingHandler()}
          onKeyUp={() => {}}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          <span
            className={classNames(
              !header.column.getCanSort()
                ? "pointer-events-none hidden w-0"
                : "cursor-pointer",
              "ml-2 flex-none inline-flex items-center gap-0.5 rounded-sm transition-colors",
              header.column.getIsSorted()
                ? "bg-gray-200 text-gray-900 group-hover:bg-gray-300"
                : "text-gray-300 group-hover:text-gray-600"
            )}
          >
            {header.column.getIsSorted() === "desc" ? (
              <ChevronDownIcon
                className={classNames(dense ? "h-4 w-4" : "h-5 w-5")}
                aria-hidden="true"
              />
            ) : header.column.getIsSorted() === "asc" ? (
              <ChevronUpIcon
                className={classNames(dense ? "h-4 w-4" : "h-5 w-5")}
                aria-hidden="true"
              />
            ) : (
              <ChevronUpDownIcon
                className={classNames(dense ? "h-4 w-4" : "h-5 w-5")}
                aria-hidden="true"
              />
            )}
            {header.column.getSortIndex() > -1 &&
              table.getState().sorting.length > 1 && (
                <span className="text-xs leading-3 text-gray-500 mr-1 self-center">
                  {header.column.getSortIndex() + 1}
                </span>
              )}
          </span>
        </div>
      )}
      <button
        type="button"
        className={classNames(
          table.options.enableColumnResizing ? "block" : "hidden",
          "absolute top-0 bottom-0 right-0 w-2 transition-colors transparent border-r-2 enabled:hover:border-gray-300 enabled:cursor-col-resize",
          header.column.getIsResizing() ? "border-gray-300" : "border-gray-100"
        )}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        disabled={!header.column.getCanResize()}
        style={{
          transform:
            table.options.columnResizeMode === "onEnd" &&
            header.column.getIsResizing()
              ? `translateX(${
                  (table.options.columnResizeDirection === "rtl" ? -1 : 1) *
                  (table.getState().columnSizingInfo.deltaOffset ?? 0)
                }px)`
              : "",
        }}
      ></button>
    </th>
  );
}

export function BaseTableBody<T extends object>({
  table,
  isLoading,
  noRowsMessage,
  children,
  className,
  style,
}: PropsWithChildren<{
  table: Table<T>;
  isLoading?: boolean;
  dense?: boolean;
  noRowsMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}>) {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const [rowsHeight, setRowsHeight] = useState(96);
  useEffect(() => {
    if (tableBodyRef.current && !isLoading) {
      setRowsHeight(tableBodyRef.current.clientHeight);
    }
  }, [isLoading]);

  return (
    <tbody
      className={cn("divide-y divide-gray-200", className)}
      style={style}
      ref={tableBodyRef}
    >
      {!isLoading ? (
        children
      ) : (
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            className="bg-slate-200 animate-pulse"
            style={{
              height: rowsHeight ?? "96px",
            }}
          />
        </tr>
      )}
      {!isLoading && table.getRowModel().rows.length === 0 && (
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            className="text-sm text-gray-500 text-center py-4 border-t border-gray-300"
          >
            {noRowsMessage}
          </td>
        </tr>
      )}
    </tbody>
  );
}

export function BaseTableCell<T extends object>({
  table,
  row,
  cell,
  idx,
  dense = false,
  style,
  className,
}: {
  table: Table<T>;
  row: Row<T>;
  cell: Cell<T, unknown>;
  idx: number;
  dense?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <td
      key={cell.id}
      style={{
        width: table.options.enableColumnResizing
          ? cell.column.getSize()
          : undefined,
        ...style,
      }}
      className={cn(
        dense ? "py-2 text-xs" : "py-4 text-sm",
        "text-left text-gray-500",
        idx === 0
          ? dense
            ? "pl-2.5 pr-1.5 sm:pl-0"
            : "pl-4 pr-3 sm:pl-0"
          : idx === row.getVisibleCells().length - 1
          ? dense
            ? "pl-1.5 pr-2.5 sm:pl-0"
            : "pl-3 pr-4 sm:pl-0"
          : dense
          ? "px-1.5"
          : "px-2",
        className
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
}
