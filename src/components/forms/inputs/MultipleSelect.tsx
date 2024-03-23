import { ReactNode, useMemo, useEffect } from "react";
import { useImmer } from "use-immer";
import { classNames } from "../../../utils/core";

interface MultipleSelectProps {
  prefix: string;
  options: { key: string; label: ReactNode }[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

const MultipleSelect: React.FC<MultipleSelectProps> = ({
  prefix,
  options,
  value,
  onChange,
}) => {
  const [selected, setSelected] = useImmer<string[]>([]);
  const optionKeys = options.map((o) => o.key);
  const allSelected = useMemo(
    () => selected.length === optionKeys.length,
    [selected.length, optionKeys.length]
  );

  const handleSelectAll = () => {
    setSelected((selected) => {
      let newSelected = selected;
      if (allSelected) {
        newSelected = [];
      } else {
        newSelected = optionKeys;
      }

      if (onChange) {
        onChange(newSelected);
      }
      return newSelected;
    });
  };

  const handleSelect = (optionKey: string) => {
    setSelected((selected) => {
      let newSelected = selected;
      if (selected.includes(optionKey)) {
        newSelected = selected.filter((o) => o !== optionKey);
      } else {
        newSelected = [...selected, optionKey];
      }

      if (onChange) {
        onChange(newSelected);
      }
      return newSelected;
    });
  };

  useEffect(() => {
    if (value) {
      setSelected(value);
    }
  });

  return (
    <fieldset className="border-b-2 border-b-gray-200">
      <legend className="sr-only">{prefix} Multiple Select</legend>
      <div className="rounded bg-gray-100 px-4 py-2 relative flex items-start">
        <label
          htmlFor={prefix + "_select_all"}
          className="flex items-center h-6 gap-3 cursor-pointer"
        >
          <input
            id={prefix + "_select_all"}
            name={prefix + "_select_all"}
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
            checked={allSelected}
            onChange={handleSelectAll}
          />
          <span className="text-sm leading-6 font-medium text-gray-900">
            {allSelected ? "Unselect All" : "Select All"}
          </span>
        </label>
      </div>
      <div className="space-y-3 px-4 max-h-56 overflow-y-auto">
        {options.map((option, idx) => (
          <label
            key={prefix + "_option_" + option.key}
            htmlFor={prefix + "_option_" + option.key}
            className={classNames(
              "flex items-center items gap-3 cursor-pointer",
              idx === 0 ? "pt-3" : idx === options.length - 1 ? "pb-3" : ""
            )}
          >
            <input
              id={prefix + "_option_" + option.key}
              name={prefix + "_option_" + option.key}
              type="checkbox"
              className="h-4 w-4 rounded cursor-pointer border-gray-300 text-secondary-600 focus:ring-secondary-600"
              checked={selected.includes(option.key)}
              onChange={() => handleSelect(option.key)}
            />
            <div className="text-sm leading-6">{option.label}</div>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default MultipleSelect;
