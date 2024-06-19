import { FormEvent, PropsWithChildren } from "react";

interface SlideOverFormProps extends PropsWithChildren {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  closeText?: string;
  submitText?: string;
  readOnly?: boolean;
}

const SlideOverForm: React.FC<SlideOverFormProps> = ({
  onSubmit,
  onClose,
  children,
  closeText,
  submitText = "Save",
  readOnly = false,
}) => {
  return (
    <form className="flex h-screen flex-col" onSubmit={onSubmit}>
      {children}
      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          <div className="grow" />
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => onClose()}
          >
            {closeText ?? (readOnly ? "Close" : "Cancel")}
          </button>
          {!readOnly && (
            <button
              type="submit"
              className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              {submitText}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default SlideOverForm;
