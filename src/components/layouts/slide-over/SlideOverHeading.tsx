import { DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";

interface SlideOverHeadingProps {
  title: ReactNode;
  description: ReactNode;
  setOpen: (open: boolean) => void;
}

const SlideOverHeading: React.FC<SlideOverHeadingProps> = ({
  title,
  description,
  setOpen,
}) => {
  return (
    <div className="bg-gray-50 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between space-x-3">
        <div className="space-y-1">
          <DialogTitle className="text-base font-semibold leading-6 text-gray-900">
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex h-7 items-center">
          <button
            type="button"
            className="relative text-gray-400 hover:text-gray-500"
            onClick={() => setOpen(false)}
          >
            <span className="absolute -inset-2.5" />
            <span className="sr-only">Close panel</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideOverHeading;
