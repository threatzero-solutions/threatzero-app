import { ReactNode, useEffect, useRef, useState } from "react";
import { classNames } from "../../utils/core";
import Paginator, { PaginatorProps } from "./Paginator";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { OrderOptions, Ordering } from "../../types/core";

import FilterBar, { FilterBarFilterOptions } from "./FilterBar";
import { SearchInputProps } from "../forms/inputs/SearchInput";

export interface DataTableOrderOptions {
  order?: Ordering;
  setOrder?: (key: string, value: OrderOptions) => void;
}

interface DataTableProps {
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  dense?: boolean;
  data?: {
    headers: {
      label: ReactNode;
      key: string;
      align?: "left" | "center" | "right";
      noSort?: boolean;
      hidden?: boolean;
    }[];
    rows: {
      id: string;
      [key: string]: ReactNode;
    }[];
  };
  isLoading?: boolean;
  notFoundDetail?: ReactNode;
  paginationOptions?: PaginatorProps;
  searchOptions?: SearchInputProps;
  filterOptions?: FilterBarFilterOptions;
  orderOptions?: DataTableOrderOptions;
}

const DataTable: React.FC<DataTableProps> = ({
  className,
  title,
  subtitle,
  action,
  dense,
  data,
  isLoading,
  notFoundDetail,
  paginationOptions,
  orderOptions,
  searchOptions,
  filterOptions,
}) => {
  const rowsRef = useRef<HTMLTableSectionElement>(null);

  const [rowsHeight, setRowsHeight] = useState(96);
  useEffect(() => {
    if (rowsRef.current && !isLoading) {
      setRowsHeight(rowsRef.current.clientHeight);
    }
  }, [isLoading, rowsRef.current]);

  return (
    <div className={className}>
      <div>
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
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">{action}</div>
        </div>
        {(searchOptions || filterOptions) && (
          <div className="mt-4 -mb-4">
            <FilterBar
              searchOptions={searchOptions}
              filterOptions={filterOptions}
            />
          </div>
        )}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {data?.headers
                      .filter((h) => !h.hidden)
                      .map(({ label, key, align, noSort }, idx) => (
                        <th
                          key={key}
                          scope="col"
                          className={classNames(
                            dense ? "py-1.5" : "py-3.5",
                            "text-left text-sm font-semibold text-gray-900",
                            idx === 0
                              ? dense
                                ? "pl-2.5 pr-1.5 sm:pl-0"
                                : "pl-4 pr-3 sm:pl-0"
                              : idx === data.headers.length - 1
                              ? dense
                                ? "pl-1.5 pr-2.5 sm:pl-0"
                                : "pl-3 pr-4 sm:pl-0"
                              : dense
                              ? "px-1.5"
                              : "px-2",
                            `text-${align ?? "left"}`
                          )}
                        >
                          <div
                            className={classNames(
                              "whitespace-nowrap group inline-flex",
                              !noSort && orderOptions?.setOrder
                                ? "cursor-pointer"
                                : ""
                            )}
                            onClick={() =>
                              !noSort &&
                              orderOptions?.setOrder?.(
                                key,
                                orderOptions?.order?.[key] === "ASC"
                                  ? "DESC"
                                  : "ASC"
                              )
                            }
                            onKeyUp={() => {}}
                          >
                            {label}
                            {!noSort && !!orderOptions?.setOrder && (
                              <span
                                className={classNames(
                                  "ml-2 flex-none rounded transition-colors",
                                  orderOptions?.order?.[key]
                                    ? "bg-gray-100 text-gray-900 group-hover:bg-gray-200"
                                    : "invisible text-gray-400 group-hover:visible group-focus:visible"
                                )}
                              >
                                {orderOptions?.order?.[key] !== "ASC" ? (
                                  <ChevronDownIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ChevronUpIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200" ref={rowsRef}>
                  {!isLoading &&
                    data?.rows.map((row) => (
                      <tr key={row.id}>
                        {data.headers
                          .filter((h) => !h.hidden)
                          .map(({ key, align }, idx_col) => (
                            <td
                              key={`${row.id}_${key}`}
                              className={classNames(
                                dense ? "py-2" : "py-4",
                                "text-sm text-gray-500",
                                idx_col === 0
                                  ? dense
                                    ? "pl-2.5 pr-1.5 sm:pl-0"
                                    : "pl-4 pr-3 sm:pl-0"
                                  : idx_col === data.headers.length - 1
                                  ? dense
                                    ? "pl-1.5 pr-2.5 sm:pl-0"
                                    : "pl-3 pr-4 sm:pl-0"
                                  : dense
                                  ? "px-1.5"
                                  : "px-2",
                                `text-${align ?? "left"}`
                              )}
                            >
                              {row[key]}
                            </td>
                          ))}
                      </tr>
                    ))}
                </tbody>
              </table>
              {isLoading && (
                <div className="w-full">
                  <div className="animate-pulse flex-1">
                    <div
                      className="bg-slate-200"
                      style={{
                        height: rowsHeight ?? "96px",
                      }}
                    />
                  </div>
                </div>
              )}
              {!isLoading && data && data.rows.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 border-t border-gray-300">
                  {notFoundDetail ?? "No details."}
                </p>
              )}
            </div>
          </div>
        </div>
        {paginationOptions && <Paginator {...paginationOptions} />}
      </div>
    </div>
  );
};

export default DataTable;
