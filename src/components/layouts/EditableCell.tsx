import { useRef, useState } from "react";
import { CheckIcon, PencilIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useOnClickOutside } from "usehooks-ts";
import { classNames } from "../../utils/core";

interface EditableCellProps {
  value: string | undefined;
  onSave: (value: string) => void;
  emptyValue?: string;
  readOnly?: boolean;
  alwaysShowEdit?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  emptyValue,
  readOnly,
  alwaysShowEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState<string>();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setIsEditing(false);
    setUpdatedValue(undefined);
  };

  const handleCancel = () => {
    handleReset();
  };

  const handleSave = () => {
    onSave(updatedValue ?? value ?? "");
    handleReset();
  };

  useOnClickOutside(inputRef, handleCancel);

  return (
    <div>
      {!readOnly && isEditing ? (
        <div className="relative w-min" ref={inputRef}>
          <input
            value={updatedValue ?? value ?? ""}
            onChange={(e) => setUpdatedValue(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleSave()}
            size={10}
            className="block rounded-md px-2 py-1 pr-14 border-0 ring-inset ring-1 ring-gray-200 focus:ring-1 focus:ring-inset focus:ring-gray-300 text-sm"
          />
          <div className="flex gap-1 items-center absolute right-0 inset-y-0 pr-3">
            <button onClick={handleSave} type="button">
              <CheckIcon
                className="h-4 w-4 text-secondary-500"
                aria-hidden="true"
              />
              <span className="sr-only">Save</span>
            </button>
            <button onClick={handleCancel} type="button">
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={classNames(
            "flex items-center gap-2 group text-left hover:opacity-80 transition-opacity",
            readOnly ? "" : "cursor-pointer"
          )}
        >
          <span>{value ?? emptyValue}</span>
          <PencilIcon
            className={classNames(
              "h-4 w-4 transition-opacity",
              readOnly
                ? "opacity-0"
                : alwaysShowEdit
                ? "opacity-80"
                : "opacity-0 group-hover:opacity-80"
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

export default EditableCell;
