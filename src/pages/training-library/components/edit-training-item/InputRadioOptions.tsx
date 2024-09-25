import { useEffect, useState } from "react";
import { classNames } from "../../../../utils/core";

export interface InputRadioOption {
  id: string;
  name: string;
  children?: React.ReactNode;
}

const InputRadioOptions: React.FC<{
  options: InputRadioOption[];
  onSelect?: (id: string) => void;
  defaultSelection?: string;
  ref?: React.RefObject<HTMLObjectElement>;
}> = ({ options, onSelect, ref, defaultSelection }) => {
  const defaultIdx =
    (defaultSelection && options.findIndex((o) => o.id === defaultSelection)) ||
    0;
  const [idxSelected, setIdxSelected] = useState<number>(defaultIdx);

  useEffect(() => {
    setIdxSelected((prev) => {
      if (prev) {
        return prev;
      }
      return defaultIdx;
    });
  }, [defaultIdx]);

  useEffect(() => {
    onSelect?.(options[idxSelected].id);
  }, [idxSelected, options, onSelect]);

  return (
    <fieldset>
      <div className="space-y-5" ref={ref}>
        {options.map((mediaOption, idx) => (
          <div key={mediaOption.id} className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id={mediaOption.id}
                name={mediaOption.id}
                type="radio"
                checked={idx === idxSelected}
                onChange={() => setIdxSelected(idx)}
                className="h-4 w-4 border-gray-300 text-secondary-600 focus:ring-secondary-600"
              />
            </div>
            <div className="ml-3 text-sm leading-6 w-full">
              <label
                htmlFor={mediaOption.id}
                className="font-medium text-gray-900"
              >
                {mediaOption.name}
              </label>
              {mediaOption.children && (
                <div
                  className={classNames(
                    "text-gray-500 mt-2 grid grid-cols-1",
                    idx !== idxSelected ? "opacity-50 pointer-events-none" : ""
                  )}
                >
                  {mediaOption.children}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default InputRadioOptions;
