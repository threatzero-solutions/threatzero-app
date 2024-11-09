import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { classNames } from "../../../utils/core";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useDebounceCallback } from "usehooks-ts";

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
  immediate?: boolean;
  required?: boolean;
  disabled?: boolean;
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
  immediate,
  required,
  disabled = false,
}: AutocompleteProps<V>) => {
  const debouncedSetQuery = useDebounceCallback(setQuery, 350);

  return (
    <div>
      <Combobox
        as="div"
        immediate={immediate}
        onChange={onChange}
        value={value}
        className="relative"
        disabled={disabled}
      >
        {label && (
          <Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            {label}
          </Label>
        )}
        <div className="relative">
          <ComboboxInput
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
            onChange={(e) => debouncedSetQuery(e.target.value)}
            displayValue={displayValue ?? ((v) => `${v}`)}
            placeholder={placeholder ?? "Search..."}
            type="search"
            required={required}
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
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.length === 0 && (
                <ComboboxOption
                  value={null}
                  disabled={true}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
                >
                  No results
                </ComboboxOption>
              )}
              {options.map((option) => (
                <ComboboxOption
                  key={option?.id ?? -1}
                  value={option}
                  className={({ focus }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-3 pr-9",
                      focus ? "bg-secondary-600 text-white" : "text-gray-900"
                    )
                  }
                >
                  <span className="block truncate">
                    {displayValue ? displayValue(option) : `${option}`}
                  </span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          )}
        </div>
      </Combobox>
    </div>
  );
};

export default Autocomplete;
