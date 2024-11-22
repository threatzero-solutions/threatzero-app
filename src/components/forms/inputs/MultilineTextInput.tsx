import { DetailedHTMLProps, InputHTMLAttributes, useMemo } from "react";
import Input from "./Input";
import { SimpleChangeEvent } from "../../../types/core";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../../utils/core";

type MultilineTextInputProps<K extends string | number | symbol> = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "name" | "value" | "onChange"
> & {
  name?: K;
  value: string[];
  onChange: (value: SimpleChangeEvent<string[], K>) => void;
};

const MultilineTextInput = <K extends string | number | symbol = string>({
  value,
  onChange,
  className,
  required,
  name = "multilineText" as K,
  ...props
}: MultilineTextInputProps<K>) => {
  const lines = useMemo(
    () => (value.length ? value : required ? [""] : []),
    [value, required]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const { value } = e.target;
    const newLines = lines.map((l, i) => (i === idx ? value : l));

    onChange({ target: { name, value: newLines } });
  };

  const handleRemoveLine = (idx: number) => {
    const newLines = lines.filter((_, i) => i !== idx);
    onChange({ target: { name, value: newLines } });
  };

  const handleAddLine = () => {
    onChange({ target: { name, value: [...lines, ""] } });
  };

  return (
    <div className="flex flex-col gap-2">
      {lines.map((v, i) => (
        <div className="relative" key={i}>
          <Input
            value={v}
            onChange={(e) => handleChange(e, i)}
            className={classNames("w-full pr-10", className)}
            required
            {...props}
          />
          {lines.length > 1 && (
            <div
              className={
                "cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-75 transition-opacity"
              }
              onClick={() => handleRemoveLine(i)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => handleAddLine()}
        className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        + Add
      </button>
    </div>
  );
};

export default MultilineTextInput;
