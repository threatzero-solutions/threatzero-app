import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useMemo } from "react";
import { Paginated } from "../../types/entities";
import { classNames } from "../../utils/core";

export interface PageOptions {
  limit: number;
  offset: number;
  search?: string;
}

export type CurrentPage = Partial<Omit<Paginated<unknown>, "results">>;

export interface PaginatorProps extends CurrentPage {
  pageSize?: number;
  setOffset: (offset: number) => void;
}

const MAX_PAGE_BUTTONS = 7;

export const DEFAULT_PAGE_SIZE = 10;

const Paginator: React.FC<PaginatorProps> = ({
  pageSize,
  offset: currentOffset,
  count: total,
  limit,
  setOffset,
}) => {
  const nextLimit = useMemo(() => pageSize ?? DEFAULT_PAGE_SIZE, [pageSize]);
  const offset = useMemo(() => currentOffset ?? 0, [currentOffset]);
  const count = useMemo(() => total ?? 0, [total]);
  const currentLimit = useMemo(() => limit ?? DEFAULT_PAGE_SIZE, [limit]);

  const activePage = useMemo(() => offset / nextLimit + 1, [offset, nextLimit]);

  const totalPages = useMemo(() => {
    return Array.from(
      { length: Math.ceil(count / nextLimit) },
      (_, i) => i + 1
    );
  }, [count, nextLimit]);

  const pageButtons = useMemo(() => {
    if (!totalPages.length) return [];

    const c = totalPages.length;
    const condenseButtons = c > MAX_PAGE_BUTTONS;
    const defaultBreakerPosition = Math.ceil(MAX_PAGE_BUTTONS / 2);
    const breakerPositions =
      Math.min(activePage, c - activePage + 1) < defaultBreakerPosition
        ? [defaultBreakerPosition]
        : [2, c - 1];

    return totalPages.reduce((acc, p) => {
      let showPage = true;
      if (breakerPositions[0] === defaultBreakerPosition) {
        showPage =
          p < defaultBreakerPosition || p > c - defaultBreakerPosition + 1;
      } else {
        showPage =
          (p >= activePage - 1 && p <= activePage + 1) || p === 1 || p === c;
      }
      if (condenseButtons && !showPage) {
        if (breakerPositions.includes(p)) {
          acc.push(null);
        }
        return acc;
      }
      acc.push(p);
      return acc;
    }, [] as (number | null)[]);
  }, [totalPages, activePage]);

  const handleChangePage = (newPage: number) => {
    setOffset((newPage - 1) * nextLimit);
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => handleChangePage(activePage - 1)}
          disabled={!totalPages.length || activePage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:hover:bg-white disabled:text-gray-400"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => handleChangePage(activePage + 1)}
          disabled={!totalPages.length || activePage === totalPages.length}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:hover:bg-white disabled:text-gray-400"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{offset + 1}</span> to{" "}
            <span className="font-medium">{offset + currentLimit}</span> of{" "}
            <span className="font-medium">{count}</span> results
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-xs"
            aria-label="Pagination"
          >
            <button
              type="button"
              onClick={() => handleChangePage(activePage - 1)}
              disabled={!totalPages.length || activePage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:hover:bg-white disabled:text-gray-400"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {pageButtons.map((p) =>
              p === null ? (
                <span
                  key={`page-${p}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => handleChangePage(p)}
                  className={classNames(
                    "relative hidden items-center px-4 py-2 text-sm font-semibold focus:z-20 md:inline-flex",
                    p === activePage
                      ? "z-10 bg-secondary-600 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                  )}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => handleChangePage(activePage + 1)}
              disabled={!totalPages.length || activePage === totalPages.length}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:hover:bg-white disabled:text-gray-400"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Paginator;
