import { ComponentProps, ReactNode } from "react";
import { cn } from "../../../utils/core";

export interface RadioTypeOptions {
  options: { [key: string]: ReactNode | string };
  orientation?: "horizontal" | "vertical";
  label?: string;
}

const RadioOptions = ({
  options,
  orientation = "vertical",
  ...attrs
}: RadioTypeOptions & ComponentProps<"input">) => {
  return (
    <fieldset className={cn(attrs.className)}>
      <legend className="sr-only">{`${attrs.label}`}</legend>
      <div
        className={cn(
          "flex flex-col",
          orientation === "horizontal"
            ? "gap-y-4 sm:flex-row sm:items-center sm:gap-x-10 sm:flex-wrap"
            : "gap-y-4"
        )}
      >
        {Object.entries(options).map(([value, label]) => (
          <div key={value} className="flex items-center">
            <input
              {...attrs}
              id={`${attrs.id}_${value}`}
              className="peer h-4 w-4 border-gray-300 text-secondary-600 focus:ring-secondary-600 disabled:opacity-70"
              type="radio"
              value={value}
              checked={attrs.value === value}
              name={attrs.name}
            />
            <label
              htmlFor={`${attrs.id}_${value}`}
              className="ml-3 block text-sm font-medium leading-6 text-gray-900 peer-disabled:opacity-70"
            >
              {label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default RadioOptions;
