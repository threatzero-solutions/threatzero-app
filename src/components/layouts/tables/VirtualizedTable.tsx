import { Row, Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { BaseTableBody, BaseTableCell, BaseTableHeaderCell } from "./BaseTable";

interface Props<T extends object> {
  height: number | string;
  table: Table<T>;
  isLoading?: boolean;
  noRowsMessage?: string;
  dense?: boolean;
}

export default function VirtualizedTable<T extends object>({
  height,
  table,
  isLoading = false,
  noRowsMessage = "No results.",
  dense = false,
}: Props<T>) {
  // The virtualizer will need a reference to the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative overflow-auto"
      style={{
        height,
      }}
      ref={tableContainerRef}
    >
      <table
        className="grid"
        style={{
          width: table.options.enableColumnResizing
            ? table.getCenterTotalSize()
            : undefined,
        }}
      >
        <thead className="grid sticky top-0 z-10">
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
                  style={{
                    width: header.getSize(),
                  }}
                />
              ))}
            </tr>
          ))}
        </thead>
        <VirtualizedTableBody
          table={table}
          isLoading={isLoading}
          noRowsMessage={noRowsMessage}
          tableContainerRef={tableContainerRef}
          dense={dense}
        />
      </table>
    </div>
  );
}

function VirtualizedTableBody<T extends object>({
  table,
  isLoading,
  noRowsMessage,
  tableContainerRef,
  dense = false,
}: {
  table: Table<T>;
  isLoading?: boolean;
  noRowsMessage?: string;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  dense?: boolean;
}) {
  const { rows } = table.getRowModel();

  // Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <BaseTableBody
      table={table}
      isLoading={isLoading}
      noRowsMessage={noRowsMessage}
      className="relative grid"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<T>;
        return (
          <tr
            key={row.id}
            data-index={virtualRow.index} //needed for dynamic row height measurement
            ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            className="absolute w-full flex"
            style={{
              transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            }}
          >
            {row.getVisibleCells().map((cell, idx) => (
              <BaseTableCell
                key={cell.id}
                table={table}
                row={row}
                cell={cell}
                idx={idx}
                dense={dense}
                style={{
                  width: cell.column.getSize(),
                }}
              />
            ))}
          </tr>
        );
      })}
    </BaseTableBody>
  );
}
