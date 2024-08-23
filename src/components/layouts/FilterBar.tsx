import { classNames } from "../../utils/core";
import Dropdown, { DropdownAction } from "./Dropdown";
import SearchInput, { SearchInputProps } from "../forms/inputs/SearchInput";
import { Updater, useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../hooks/use-item-filter-query";
import { useCallback, useEffect, useRef } from "react";

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
      : !!filter.defaultValue
      ? [filter.defaultValue]
      : []
    : filter.defaultValue ?? undefined;
};

const buildFilterValues = (filters: FilterBarFilter[]) =>
  filters.reduce((acc, f) => {
    acc[f.key] = buildFilterValue(f);
    return acc;
  }, {} as Record<string, string | string[] | undefined>);

const mergeOptions = (
  options1: FilterBarFilterOption[],
  options2: FilterBarFilterOption[]
) =>
  [
    ...options1.filter((o) => !options2.find((o2) => o.value === o2.value)),
    ...options2,
  ].sort((o1, o2) => o1.label.localeCompare(o2.label));

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
  const [selectedOptions, setSelectedOptions] = useImmer(
    filterOptions?.filters?.reduce((acc, f) => {
      acc[f.key] = [];
      return acc;
    }, {} as Record<string, FilterBarFilterOption[]>)
  );

  useEffect(() => {
    // Only update until user interacts with filters. This is because upstream defaults may
    // change during initial render.
    if (!stable.current && filterOptions?.filters) {
      setFilterValues(buildFilterValues(filterOptions.filters));
    }
  }, [filterOptions?.filters]);

  const handleSetFilter = (
    e: React.MouseEvent<HTMLButtonElement>,
    f: FilterBarFilter,
    value: string | undefined
  ) => {
    e.preventDefault();

    // Consider props stable once user interacts with filters.
    stable.current = true;

    setFilterValues((draft) => {
      const prevValue = draft[f.key];
      let newValue: string | string[] | undefined;

      if (f.many) {
        newValue = draft[f.key];

        if (!value || !Array.isArray(prevValue)) {
          newValue = [];
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

      const doSetFilter = (thisKey: string, thisValue?: string | string[]) => {
        draft[thisKey] = thisValue;

        if (filterOptions?.setFilter) {
          filterOptions.setFilter(thisKey, thisValue);
        } else {
          filterOptions?.setQuery?.((q) => {
            q[thisKey] = thisValue;
            q.offset = 0;
          });
        }

        console.debug(draft[thisKey]);

        setSelectedOptions((draft) => {
          if (!draft) {
            return;
          }

          draft[thisKey] = mergeOptions(draft[thisKey], f.options).filter((o) =>
            o.value && Array.isArray(thisValue)
              ? thisValue?.includes(o.value)
              : thisValue === o.value
          );
        });
      };

      doSetFilter(f.key, newValue);
      f.onSetFilter?.(newValue, doSetFilter);
    });
  };

  const buildOptions = useCallback(
    (f: FilterBarFilter) =>
      mergeOptions(selectedOptions?.[f.key] ?? [], f.options),
    [selectedOptions]
  );

  return (
    <div className="flex justify-end gap-4">
      {filterOptions && (
        <Dropdown
          value="Filter"
          actionGroups={filterOptions.filters
            ?.filter((f) => !f.hidden)
            .map((f) => ({
              id: `id-${f.key}`,
              value: (
                <div className="inline-flex flex-col gap-2">
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
              actions: f.isLoading
                ? [
                    {
                      id: "loading",
                      value: (
                        <div className="animate-pulse rounded-md bg-slate-100 px-4 py-4 shadow sm:p-3" />
                      ),
                      disabled: true,
                    },
                  ]
                : f.setQuery && buildOptions(f).length === 0
                ? [
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
                    },
                  ]
                : [
                    ...buildOptions(f)
                      .map((o) => ({
                        ...o,
                        selected: Array.isArray(filterValues[f.key])
                          ? filterValues[f.key]?.includes(o.value ?? "none")
                          : o.value === filterValues[f.key],
                      }))
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
                            action: (e) => handleSetFilter(e, f, o.value),
                          } as DropdownAction)
                      ),
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
                      action: (e) => handleSetFilter(e, f, undefined),
                      disabled: Array.isArray(filterValues[f.key])
                        ? !filterValues[f.key]?.length
                        : filterValues[f.key] === undefined,
                      hidden: f.options.some((o) => o.value === undefined),
                    },
                  ],
            }))}
          showDividers={true}
        />
      )}
      {searchOptions && <SearchInput {...searchOptions} />}
    </div>
  );
};

export default FilterBar;
