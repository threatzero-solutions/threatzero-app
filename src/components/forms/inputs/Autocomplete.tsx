import { Combobox } from "@headlessui/react";
import { ChangeEvent, useRef } from "react";
import { classNames } from "../../../utils/core";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface AutocompleteProps<V extends { id: string }> {
  value: V | null | undefined;
  onChange?: (value: V) => void;
  onRemove?: (value: V) => void;
  name?: string;
  label?: string;
  setQuery: (query: string) => void;
  options?: V[];
  placeholder?: string;
  displayValue?: (v: V) => string;
}

const Autocomplete = <V extends { id: string }>({
  value,
  onChange,
  onRemove,
  label,
  setQuery,
  options,
  placeholder,
  displayValue,
}: AutocompleteProps<V>) => {
  const queryDebounce = useRef<number>();

  const handleQuery = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(queryDebounce.current);
    queryDebounce.current = setTimeout(() => {
      setQuery(event.target.value);
    }, 350);
  };

  return (
    <div>
      <Combobox as="div" onChange={onChange} value={value} className="relative">
        {label && (
          <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            {label}
          </Combobox.Label>
        )}
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
            onChange={handleQuery}
            displayValue={displayValue ?? ((v) => `${v}`)}
            placeholder={placeholder ?? "Search..."}
            type="search"
          />
          {value && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(value)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          )}
          {options && (
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.length === 0 && (
                <Combobox.Option
                  value={null}
                  disabled={true}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
                >
                  No results
                </Combobox.Option>
              )}
              {options.map((option) => (
                <Combobox.Option
                  key={option?.id ?? -1}
                  value={option}
                  className={({ active }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-3 pr-9",
                      active ? "bg-secondary-600 text-white" : "text-gray-900"
                    )
                  }
                >
                  <span className="block truncate">
                    {displayValue ? displayValue(option) : `${option}`}
                  </span>
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
};

export default Autocomplete;
