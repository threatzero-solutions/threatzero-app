import { classNames } from "../../utils/core";
import Dropdown from "./Dropdown";
import SearchInput, { SearchInputProps } from "../forms/inputs/SearchInput";

export interface FilterBarFilterOption {
  label: string;
  value?: string;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  options: FilterBarFilterOption[];
  value?: string | string[];
  hidden?: boolean;
  selected?: boolean;
  query?: string;
  setQuery?: (query: string) => void;
  queryPlaceholder?: string;
  isLoading?: boolean;
}

export interface FilterBarFilterOptions {
  filters?: FilterBarFilter[];
  setFilter?: (key: string, value?: string) => void;
}

interface FilterBarProps {
  searchOptions?: SearchInputProps;
  filterOptions?: FilterBarFilterOptions;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchOptions,
  filterOptions,
}) => {
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
                      action: () => {},
                    },
                  ]
                : [
                    ...f.options.map((o) => ({
                      id: o.value ?? "none",
                      value: (
                        <div className="pl-1">
                          <input
                            type="checkbox"
                            readOnly={true}
                            className="pointer-events-none h-4 w-4 mr-2 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
                            checked={
                              Array.isArray(f.value)
                                ? f.value.includes(o.value ?? "none")
                                : o.value === f.value
                            }
                          />
                          {o.label}
                        </div>
                      ),
                      action: () => filterOptions?.setFilter?.(f.key, o.value),
                    })),
                    {
                      id: "clear",
                      value: (
                        <span
                          className={classNames(
                            "pl-1 text-xs font-semibol",
                            (
                              Array.isArray(f.value)
                                ? !f.value.length
                                : f.value === undefined
                            )
                              ? "text-gray-400"
                              : "text-secondary-600"
                          )}
                        >
                          clear
                        </span>
                      ),
                      action: () =>
                        filterOptions?.setFilter?.(f.key, undefined),
                      disabled: Array.isArray(f.value)
                        ? !f.value.length
                        : f.value === undefined,
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
