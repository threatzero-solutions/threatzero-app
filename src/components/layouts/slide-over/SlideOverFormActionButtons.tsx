import dayjs from "dayjs";
import { classNames } from "../../../utils/core";
import { MouseEvent } from "react";

export interface SlideOverFormActionButtonsProps {
  onDone?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClose: (e: MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e: MouseEvent<HTMLButtonElement>) => void;
  hideDelete?: boolean;
  closeText?: string;
  submitText?: string;
  deleteText?: string;
  readOnly?: boolean;
  lastUpdated?: string | Date;
  isSaving?: boolean;
}

const SlideOverFormActionButtons: React.FC<SlideOverFormActionButtonsProps> = ({
  onDone,
  onClose,
  onDelete,
  hideDelete,
  closeText,
  submitText = "Save",
  deleteText = "Delete",
  readOnly = false,
  lastUpdated,
  isSaving = false,
}) => {
  return (
    <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
      <div className="flex space-x-3 items-center">
        {!hideDelete && onDelete && (
          <button
            type="button"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
            onClick={onDelete}
          >
            {deleteText}
          </button>
        )}
        <div className="grow" />
        {(lastUpdated || isSaving) && (
          <span className="text-xs italic text-gray-500">
            {isSaving
              ? "Updating..."
              : lastUpdated
              ? `Updated ${dayjs(lastUpdated).fromNow()}`
              : ""}
          </span>
        )}
        <button
          type="button"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={onClose}
        >
          {closeText ?? (readOnly ? "Close" : "Cancel")}
        </button>
        {!readOnly && (
          <button
            type={onDone ? "button" : "submit"}
            onClick={onDone}
            className={classNames(
              "inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-400",
              isSaving ? "animate-pulse" : ""
            )}
            disabled={isSaving}
          >
            {submitText}
          </button>
        )}
      </div>
    </div>
  );
};

export default SlideOverFormActionButtons;
