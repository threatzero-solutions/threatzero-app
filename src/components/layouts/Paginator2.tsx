import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useMemo } from "react";
import { classNames } from "../../utils/core";

export interface PageOptions {
  limit: number;
  offset: number;
  search?: string;
}

export interface Paginator2Props {
  pageCount: number;
  canPreviousPage: boolean;
  previousPage: () => void;
  canNextPage: boolean;
  nextPage: () => void;
  rowStart: number;
  rowEnd: number;
  rowTotal: number;
  setPageIndex: (idx: number) => void;
  pageIndex: number;

  className?: string;
}

const MAX_PAGE_BUTTONS = 7;

export const DEFAULT_PAGE_SIZE = 10;

const Paginator2: React.FC<Paginator2Props> = ({
  pageCount,
  canPreviousPage,
  previousPage,
  canNextPage,
  nextPage,
  rowStart,
  rowEnd,
  rowTotal,
  setPageIndex,
  pageIndex,
  className,
}) => {
  const totalPages = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }, [pageCount]);

  const pageButtons = useMemo(() => {
    if (!totalPages.length) return [];

    const c = totalPages.length;
    const condenseButtons = c > MAX_PAGE_BUTTONS;
    const defaultBreakerPosition = Math.ceil(MAX_PAGE_BUTTONS / 2);
    const breakerPositions =
      Math.min(pageIndex + 1, c - pageIndex + 2) < defaultBreakerPosition
        ? [defaultBreakerPosition]
        : [2, c - 1];

    return totalPages.reduce((acc, p) => {
      let showPage = true;
      if (breakerPositions[0] === defaultBreakerPosition) {
        showPage =
          p < defaultBreakerPosition || p > c - defaultBreakerPosition + 1;
      } else {
        showPage = (p >= pageIndex && p <= pageIndex + 2) || p === 1 || p === c;
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
  }, [totalPages, pageIndex]);

  return (
    <div
      className={classNames(
        "flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6",
        className
      )}
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:hover:bg-white disabled:text-gray-400"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => nextPage()}
          disabled={!canNextPage}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:hover:bg-white disabled:text-gray-400"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{rowStart}</span> to{" "}
            <span className="font-medium">{rowEnd}</span> of{" "}
            <span className="font-medium">{rowTotal}</span> results
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-xs"
            aria-label="Pagination"
          >
            <button
              type="button"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
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
                  onClick={() => setPageIndex(p - 1)}
                  className={classNames(
                    "relative hidden items-center px-4 py-2 text-sm font-semibold focus:z-20 md:inline-flex",
                    p - 1 === pageIndex
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
              onClick={() => nextPage()}
              disabled={!canNextPage}
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

export default Paginator2;
