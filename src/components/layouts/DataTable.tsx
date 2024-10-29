import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { classNames } from "../../utils/core";
import Paginator, { PaginatorProps } from "./Paginator";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { OrderOptions, Ordering } from "../../types/core";

import FilterBar, { FilterBarFilterOptions } from "./FilterBar";
import { SearchInputProps } from "../forms/inputs/SearchInput";
import { ItemFilterQueryParams } from "../../hooks/use-item-filter-query";
import { DraftFunction } from "use-immer";

export interface DataTableOrderOptions {
  hidden?: boolean;
  order?: Ordering;
  setOrder?: (key: string, value: OrderOptions) => void;
}

export interface DataTablePaginatorOptions
  extends Omit<PaginatorProps, "setOffset"> {
  setOffset?: (offset: number) => void;
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
  paginationOptions?: DataTablePaginatorOptions;
  searchOptions?: SearchInputProps;
  filterOptions?: FilterBarFilterOptions;
  orderOptions?: DataTableOrderOptions;
  itemFilterQuery?: ItemFilterQueryParams;
  setItemFilterQuery?: (
    query: ItemFilterQueryParams | DraftFunction<ItemFilterQueryParams>
  ) => void;
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
  paginationOptions: paginationOptionsProp,
  orderOptions,
  searchOptions,
  filterOptions,
  itemFilterQuery,
  setItemFilterQuery,
}) => {
  const rowsRef = useRef<HTMLTableSectionElement>(null);

  const [rowsHeight, setRowsHeight] = useState(96);
  useEffect(() => {
    if (rowsRef.current && !isLoading) {
      setRowsHeight(rowsRef.current.clientHeight);
    }
  }, [isLoading]);

  const currentOrder = useMemo(
    () => orderOptions?.order ?? itemFilterQuery?.order,
    [orderOptions, itemFilterQuery]
  );

  const orderEnabled = useMemo(
    () =>
      !orderOptions?.hidden &&
      (!!orderOptions?.setOrder || !!setItemFilterQuery),
    [orderOptions, setItemFilterQuery]
  );

  const doUpdateSort = useCallback(
    (key: string, value: OrderOptions) => {
      if (orderOptions?.setOrder) {
        orderOptions.setOrder(key, value);
        return;
      }

      setItemFilterQuery?.((options) => {
        if (options.order) {
          if (value !== undefined && value !== null) {
            options.order[key] = value;
          } else {
            Reflect.deleteProperty(options.order, key);
          }
        }
        options.offset = 0;
      });
    },
    [setItemFilterQuery, orderOptions]
  );

  const handleUpdateSort = (key: string, noSort?: boolean) => {
    if (noSort || orderOptions?.hidden || !currentOrder) return;

    const thisOrder = currentOrder[key];
    const nextOrder =
      thisOrder === "ASC" ? "DESC" : thisOrder === "DESC" ? undefined : "ASC";
    doUpdateSort(key, nextOrder);
  };

  const paginationOptions = useMemo(() => {
    if (paginationOptionsProp) {
      if (paginationOptionsProp.setOffset) {
        return paginationOptionsProp as PaginatorProps;
      }

      if (setItemFilterQuery) {
        return {
          ...paginationOptionsProp,
          setOffset: (offset) =>
            setItemFilterQuery((q) => {
              q.offset = offset;
            }),
        };
      }
    }
  }, [paginationOptionsProp, setItemFilterQuery]);

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
                            dense ? "py-1.5 text-xs" : "py-3.5 text-sm",
                            "text-left font-semibold text-gray-900",
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
                            onClick={() => handleUpdateSort(key, noSort)}
                            onKeyUp={() => {}}
                          >
                            {label}
                            {orderEnabled && (
                              <span
                                className={classNames(
                                  noSort
                                    ? "pointer-events-none hidden w-0"
                                    : "cursor-pointer",
                                  "ml-2 flex-none inline-flex items-center gap-0.5 rounded transition-colors",
                                  currentOrder?.[key]
                                    ? "bg-gray-200 text-gray-900 group-hover:bg-gray-300"
                                    : "text-gray-300 group-hover:text-gray-600"
                                )}
                              >
                                {currentOrder?.[key] === "DESC" ? (
                                  <ChevronDownIcon
                                    className={classNames(
                                      dense ? "h-4 w-4" : "h-5 w-5"
                                    )}
                                    aria-hidden="true"
                                  />
                                ) : currentOrder?.[key] === "ASC" ? (
                                  <ChevronUpIcon
                                    className={classNames(
                                      dense ? "h-4 w-4" : "h-5 w-5"
                                    )}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ChevronUpDownIcon
                                    className={classNames(
                                      dense ? "h-4 w-4" : "h-5 w-5"
                                    )}
                                    aria-hidden="true"
                                  />
                                )}
                                {currentOrder &&
                                  Object.values(currentOrder).filter((v) => !!v)
                                    .length > 1 &&
                                  !!currentOrder[key] && (
                                    <span className="text-xs leading-3 text-gray-500 mr-1 self-center">
                                      {Object.entries(currentOrder)
                                        .filter(([, v]) => !!v)
                                        .map(([k]) => k)
                                        .indexOf(key) + 1}
                                    </span>
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
                                dense ? "py-2 text-xs" : "py-4 text-sm",
                                "text-gray-500",
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
