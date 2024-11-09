import { classNames } from "../../utils/core";
import Dropdown, { DropdownAction, DropdownActionGroup } from "./Dropdown";
import SearchInput, { SearchInputProps } from "../forms/inputs/SearchInput";
import { Updater, useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../hooks/use-item-filter-query";
import { useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { MinusCircleIcon } from "@heroicons/react/20/solid";

export interface FilterBarFilterOption {
  label: string;
  value?: string;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  options: FilterBarFilterOption[];
  many?: boolean;
  defaultValue?: string | string[] | undefined;
  hidden?: boolean;
  selected?: boolean;
  query?: string;
  setQuery?: (query: string) => void;
  queryPlaceholder?: string;
  isLoading?: boolean;
  onSetFilter?: (
    value: string | string[] | undefined,
    setFilter: (key: string, value?: string | string[]) => void
  ) => void;
  loadMore?: () => void;
  hasMore?: boolean;
}

export interface FilterBarFilterOptions {
  filters?: FilterBarFilter[];
  setFilter?: (key: string, value?: string | string[]) => void;
  setQuery?: Updater<ItemFilterQueryParams>;
}

interface FilterBarProps {
  searchOptions?: SearchInputProps;
  filterOptions?: FilterBarFilterOptions;
}

const buildFilterValue = (filter: FilterBarFilter) => {
  return filter.many
    ? Array.isArray(filter.defaultValue)
      ? filter.defaultValue
      : filter.defaultValue
      ? [filter.defaultValue]
      : []
    : filter.defaultValue ?? undefined;
};

const buildFilterValues = (filters: FilterBarFilter[]) =>
  filters.reduce((acc, f) => {
    acc[f.key] = buildFilterValue(f);
    return acc;
  }, {} as Record<string, string | string[] | undefined>);

const mergeOptions = <T extends FilterBarFilterOption>(
  options1: T[],
  options2: T[]
) =>
  [
    ...options1.filter((o) => !options2.find((o2) => o.value === o2.value)),
    ...options2,
  ].sort((o1, o2) => o1.label.localeCompare(o2.label));

const compareValues = (
  v1: undefined | string,
  v2: undefined | string | string[]
) => (v1 && Array.isArray(v2) ? v2.includes(v1) : v1 === v2);

const getNewValue = (
  f: FilterBarFilter,
  prevValue: string | string[] | undefined,
  value: string | undefined
) => {
  let newValue: string | string[] | undefined;

  if (f.many) {
    newValue = prevValue;

    if (!value || !Array.isArray(prevValue)) {
      newValue = !value ? [] : [value];
    } else {
      if (!prevValue.includes(value)) {
        newValue = [...prevValue, value];
      } else {
        newValue = prevValue.filter((v) => v !== value);
      }
    }
  } else {
    newValue = prevValue === value ? undefined : value;
  }

  return newValue;
};

const FilterBar: React.FC<FilterBarProps> = ({
  searchOptions,
  filterOptions,
}) => {
  /** Used to keep track of whether user interacts with filters. */
  const stable = useRef(false);

  /** Used to keep track of filter values internally, to simplify and consolidate
   * the logic of handling multiple select filters and single select filters.
   */
  const [filterValues, setFilterValues] = useImmer(
    buildFilterValues(filterOptions?.filters ?? [])
  );

  /** Used for keeping track of selected options, to continue displaying them
   * even when filtered out by a search query.
   */
  const [storedOptions, setStoredOptions] = useLocalStorage<
    Record<string, FilterBarFilterOption[]>
  >("filter-options", {});

  useEffect(() => {
    // Only update until user interacts with filters. This is because upstream defaults may
    // change during initial render.
    if (!stable.current && filterOptions?.filters) {
      setFilterValues(buildFilterValues(filterOptions.filters));
    }

    setStoredOptions((opts) =>
      (filterOptions?.filters ?? []).reduce((acc, f) => {
        const newOpts = Object.fromEntries(
          f.options.map((o) => [o.value, o.label])
        );
        acc[f.key] = [
          ...(opts[f.key] ?? []).filter((o) => o.value && !newOpts[o.value]),
          ...f.options,
        ];
        return acc;
      }, opts)
    );
  }, [filterOptions?.filters, setFilterValues, setStoredOptions]);

  const handleSetFilter = (
    e: React.MouseEvent<HTMLButtonElement>,
    updates:
      | {
          f: FilterBarFilter;
          value: string | undefined;
        }
      | {
          f: FilterBarFilter;
          value: string | undefined;
        }[]
  ) => {
    e.preventDefault();

    // Consider props stable once user interacts with filters.
    stable.current = true;

    setFilterValues((draft) => {
      const toUpdate: { key: string; value: string | string[] | undefined }[] =
        [];
      const addUpdate = (key: string, value: string | string[] | undefined) => {
        toUpdate.push({ key, value });
        draft[key] = value;
      };

      for (const { f, value } of Array.isArray(updates) ? updates : [updates]) {
        const newValue = getNewValue(f, draft[f.key], value);
        addUpdate(f.key, newValue);
        f.onSetFilter?.(newValue, addUpdate);
      }

      if (filterOptions?.setFilter) {
        for (const { key, value } of toUpdate) {
          filterOptions.setFilter(key, value);
        }
      } else {
        filterOptions?.setQuery?.((q) => {
          for (const { key, value } of toUpdate) {
            q[key] = value;
          }
          q.offset = 0;
        });
      }
    });
  };

  const buildOptions = useCallback(
    (f: FilterBarFilter) =>
      mergeOptions(
        (storedOptions?.[f.key] ?? [])
          .filter((o) => compareValues(o.value, filterValues[f.key]))
          .map((o) => ({ ...o, selected: true })),
        f.options.map((o) => ({
          ...o,
          selected: compareValues(o.value, filterValues[f.key]),
        }))
      ),
    [storedOptions, filterValues]
  );

  return (
    <div className="flex justify-end gap-4">
      {filterOptions && (
        <Dropdown
          value="Filter"
          actionGroups={[
            {
              id: "clear-all-filters",
              value: (
                <button
                  type="button"
                  className="inline-flex gap-1 items-center text-gray-500 text-sm hover:text-gray-600 transition-colors"
                  onClick={(e) => {
                    handleSetFilter(
                      e,
                      (filterOptions.filters ?? []).map((f) => ({
                        f,
                        value: undefined,
                      }))
                    );
                  }}
                >
                  <MinusCircleIcon className="h-4 w-4" />
                  <span className="whitespace-nowrap pb-0.5 lowercase">
                    clear all filters
                  </span>
                </button>
              ),
            },
            ...((filterOptions.filters ?? [])
              .filter((f) => !f.hidden)
              .map((f) => ({
                id: `id-${f.key}`,
                value: (
                  <div className="inline-flex flex-col gap-2 text-base">
                    {f.label}
                    {f.setQuery && (
                      <SearchInput
                        searchQuery={f.query ?? ""}
                        setSearchQuery={f.setQuery}
                        placeholder={f.queryPlaceholder}
                        className="mb-2"
                      />
                    )}
                  </div>
                ),
                actions: [
                  ...buildOptions(f)
                    // TODO: Improve sorting behavior, if needed.
                    // .sort(
                    //   (a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)
                    // )
                    .map(
                      (o) =>
                        ({
                          id: o.value ?? "none",
                          value: (
                            <div className="pl-1">
                              <input
                                type="checkbox"
                                readOnly={true}
                                className="pointer-events-none h-4 w-4 mr-2 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
                                checked={o.selected}
                              />
                              {o.label}
                            </div>
                          ),
                          action: (e) =>
                            handleSetFilter(e, { f, value: o.value }),
                          hidden: f.isLoading,
                        } as DropdownAction)
                    ),
                  {
                    id: "loading",
                    value: (
                      <div className="animate-pulse rounded-md bg-slate-100 px-4 py-4 shadow sm:p-3" />
                    ),
                    disabled: true,
                    hidden: !f.isLoading,
                  },
                  {
                    id: "load-more",
                    value: (
                      <span className="pl-1 text-xs text-end font-semibol text-secondary-600">
                        + load more
                      </span>
                    ),
                    action: (e) => {
                      e.preventDefault();
                      f.loadMore?.();
                    },
                    hidden: !f.loadMore || !f.hasMore,
                  },
                  {
                    id: "no-results",
                    value: (
                      <span className="pl-1 text-xs text-gray-600 italic">
                        No results.{" "}
                        {f.query && (
                          <span
                            className="text-secondary-600 not-italic hover:text-secondary-500 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              f.setQuery?.("");
                            }}
                          >
                            Clear search.
                          </span>
                        )}
                      </span>
                    ),
                    disabled: true,
                    hidden: !(f.setQuery && buildOptions(f).length === 0),
                  },
                  {
                    id: "clear",
                    value: (
                      <span
                        className={classNames(
                          "pl-1 text-xs font-semibol",
                          (
                            Array.isArray(filterValues[f.key])
                              ? !filterValues[f.key]?.length
                              : filterValues[f.key] === undefined
                          )
                            ? "text-gray-400"
                            : "text-secondary-600"
                        )}
                      >
                        clear
                      </span>
                    ),
                    action: (e) => handleSetFilter(e, { f, value: undefined }),
                    disabled: Array.isArray(filterValues[f.key])
                      ? !filterValues[f.key]?.length
                      : filterValues[f.key] === undefined,
                    hidden: f.options.some((o) => o.value === undefined),
                  },
                ],
              })) as DropdownActionGroup[]),
          ]}
          showDividers={true}
        />
      )}
      {searchOptions && <SearchInput {...searchOptions} />}
    </div>
  );
};

export default FilterBar;
