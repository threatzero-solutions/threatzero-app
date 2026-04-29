import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { cn } from "../../utils/core";

interface InlineNoticeProps {
  heading: ReactNode;
  body: ReactNode;
  level?: "error" | "warning" | "info" | "success";
  className?: string;
}

// Muted semantic palette per the ThreatZero brand brief: warm
// professionalism, never traffic-light. Errors are terracotta, warnings
// are warm gold, success is sage, info is a quiet warm-neutral with no
// secondary blue.
const LEVEL_STYLES = {
  error: {
    surface: "bg-danger-50",
    heading: "text-danger-700",
    body: "text-danger-700/90",
    iconColor: "text-danger-500",
    Icon: XCircleIcon,
  },
  warning: {
    surface: "bg-warning-50",
    heading: "text-warning-700",
    body: "text-warning-700/90",
    iconColor: "text-warning-500",
    Icon: ExclamationTriangleIcon,
  },
  success: {
    surface: "bg-success-50",
    heading: "text-success-700",
    body: "text-success-700/90",
    iconColor: "text-success-500",
    Icon: CheckCircleIcon,
  },
  info: {
    surface: "bg-gray-100",
    heading: "text-gray-800",
    body: "text-gray-600",
    iconColor: "text-gray-400",
    Icon: InformationCircleIcon,
  },
} as const;

const InlineNotice: React.FC<InlineNoticeProps> = ({
  heading,
  body,
  level = "info",
  className,
}) => {
  const styles = LEVEL_STYLES[level];
  const { Icon } = styles;
  return (
    <div className={cn("rounded-md p-4", styles.surface, className)}>
      <div className="flex">
        <div className="shrink-0">
          <Icon aria-hidden="true" className={cn("size-5", styles.iconColor)} />
        </div>
        <div className="ml-3 grow">
          <h3 className={cn("text-sm font-medium", styles.heading)}>
            {heading}
          </h3>
          <div className={cn("mt-2 text-sm", styles.body)}>
            {typeof body === "string" ? <p>{body}</p> : body}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineNotice;
