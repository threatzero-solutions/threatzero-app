import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import { classNames } from "../../../utils/core";

export type AlertVariant = "success" | "error" | "info";

const getNoticeStyleProps = ({ variant }: { variant: AlertVariant }) => {
  switch (variant) {
    case "success":
      return {
        title: "Success!",
        icon: CheckCircleIcon,
        iconClassName: "text-green-400",
      };
    case "error":
      return {
        title: "Error",
        icon: XCircleIcon,
        iconClassName: "text-red-400",
      };
    case "info":
    default:
      return {
        title: "Info",
        icon: InformationCircleIcon,
        iconClassName: "text-secondary-500",
      };
  }
};

interface AsProp<T extends React.ElementType> {
  as?: T;
}

type AlertProps<T extends React.ElementType> = AsProp<T> & {
  variant?: AlertVariant;
  onClose: () => void;
  message: string | string[];
} & React.ComponentProps<T>;

const Alert = <T extends React.ElementType = "div">({
  variant = "info",
  onClose,
  message,
  as: Component = "div",
  className,
  ...props
}: AlertProps<T>) => {
  const styleProps = getNoticeStyleProps({ variant });

  return (
    <Component
      {...props}
      className={classNames(
        "w-[24rem] max-w-full",
        // "transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:scale-95"
        className
      )}
    >
      <div
        className={classNames(
          "p-4",
          "pointer-events-auto w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5",
          "flex items-start"
        )}
      >
        <div className="shrink-0">
          <styleProps.icon
            className={classNames("h-6 w-6", styleProps.iconClassName)}
            aria-hidden="true"
          />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">
            {styleProps.title}
          </p>
          <p className="mt-1 text-sm text-gray-500 divide-y divide-gray-100">
            {Array.isArray(message)
              ? message.map((e, i) => (
                  <span key={i} className="block py-2">
                    {e}
                  </span>
                ))
              : message}
          </p>
        </div>
        <div className="ml-4 flex shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
            onClick={() => {
              onClose();
            }}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Component>
  );
};

export default Alert;
