import { classNames } from "../../utils/core";
import Dropdown from "./Dropdown";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Input from "../forms/inputs/Input";

export interface FilterBarSearchOptions {
  placeholder?: string;
  setSearchQuery?: (query: string) => void;
  searchQuery?: string;
  fullWidth?: boolean;
}

export interface FilterBarFilterOption {
  label: string;
  value?: string;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  options: FilterBarFilterOption[];
  value?: string;
}

export interface FilterBarFilterOptions {
  filters?: FilterBarFilter[];
  setFilter?: (key: string, value?: string) => void;
}

interface FilterBarProps {
  searchOptions?: FilterBarSearchOptions;
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
          actionGroups={filterOptions.filters?.map((f) => ({
            id: `id-${f.key}`,
            value: f.label,
            actions: [
              ...f.options.map((o) => ({
                id: o.value ?? "none",
                value: (
                  <div className="pl-1">
                    <input
                      type="checkbox"
                      readOnly={true}
                      className="pointer-events-none h-4 w-4 mr-2 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
                      checked={o.value === f.value}
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
                      f.value === undefined
                        ? "text-gray-400"
                        : "text-secondary-600"
                    )}
                  >
                    clear
                  </span>
                ),
                action: () => filterOptions?.setFilter?.(f.key, undefined),
                disabled: f.value === undefined,
                hidden: f.options.some((o) => o.value === undefined),
              },
            ],
          }))}
          openTo="left"
          showDividers={true}
        />
      )}
      {searchOptions && (
        <div
          className={classNames(
            "relative w-full",
            searchOptions.fullWidth ? "" : "max-w-80"
          )}
        >
          <Input
            type="search"
            className={classNames("w-full pr-10")}
            placeholder={searchOptions.placeholder ?? "Search..."}
            onChange={(e) => searchOptions.setSearchQuery?.(e.target.value)}
            value={searchOptions.searchQuery}
          />
          <div
            className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-75 transition-opacity"
            onClick={() => searchOptions.setSearchQuery?.("")}
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
