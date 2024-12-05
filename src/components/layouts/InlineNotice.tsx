import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { classNames } from "../../utils/core";

interface InlineNoticeProps {
  heading: ReactNode;
  body: ReactNode;
  level?: "error" | "warning" | "info" | "success";
  className?: string;
}

const InlineNotice: React.FC<InlineNoticeProps> = ({
  heading,
  body,
  level = "info",
  className,
}) => {
  return (
    <div
      className={classNames(
        "rounded-md p-4",
        level === "error"
          ? "bg-red-50"
          : level === "warning"
          ? "bg-yellow-50"
          : level === "success"
          ? "bg-green-50"
          : "bg-blue-50",
        className
      )}
    >
      <div className="flex">
        <div className="shrink-0">
          {level === "error" ? (
            <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
          ) : level === "warning" ? (
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="size-5 text-yellow-400"
            />
          ) : level === "success" ? (
            <CheckCircleIcon
              aria-hidden="true"
              className="size-5 text-green-400"
            />
          ) : (
            <InformationCircleIcon
              aria-hidden="true"
              className="size-5 text-blue-400"
            />
          )}
        </div>
        <div className="ml-3">
          <h3
            className={classNames(
              "text-sm font-medium",
              level === "error"
                ? "text-red-800"
                : level === "warning"
                ? "text-yellow-800"
                : level === "success"
                ? "text-green-800"
                : "text-blue-800"
            )}
          >
            {heading}
          </h3>
          <div
            className={classNames(
              "mt-2 text-sm",
              level === "error"
                ? "text-red-700"
                : level === "warning"
                ? "text-yellow-700"
                : level === "success"
                ? "text-green-700"
                : "text-blue-700"
            )}
          >
            {typeof body === "string" ? <p>{body}</p> : body}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineNotice;
