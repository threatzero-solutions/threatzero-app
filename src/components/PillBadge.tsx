import { ReactNode } from "react";
import { classNames } from "../utils/core";

type Color =
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "primary"
  | "secondary";

interface PillBadgeProps<V> {
  value?: V;
  displayValue: ReactNode;
  color: Color;
  isRemovable?: boolean;
  onRemove?: (value?: V) => void;
  className?: string;
  disabled?: boolean;
}

const colorStyles = {
  gray: {
    badge: "bg-gray-100 text-gray-600",
    button: "enabled:hover:bg-gray-500/20",
    icon: "stroke-gray-700/50 group-hover:group-enabled:stroke-gray-700/75",
  },
  red: {
    badge: "bg-red-100 text-red-700",
    button: "enabled:hover:bg-red-600/20",
    icon: "stroke-red-700/50 group-hover:group-enabled:stroke-red-700/75",
  },
  yellow: {
    badge: "bg-yellow-100 text-yellow-800",
    button: "enabled:hover:bg-yellow-600/20",
    icon: "stroke-yellow-800/50 group-hover:group-enabled:stroke-yellow-800/75",
  },
  green: {
    badge: "bg-green-100 text-green-700",
    button: "enabled:hover:bg-green-600/20",
    icon: "stroke-green-800/50 group-hover:group-enabled:stroke-green-800/75",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700",
    button: "enabled:hover:bg-blue-600/20",
    icon: "stroke-blue-800/50 group-hover:group-enabled:stroke-blue-800/75",
  },
  indigo: {
    badge: "bg-indigo-100 text-indigo-700",
    button: "enabled:hover:bg-indigo-600/20",
    icon: "stroke-indigo-700/50 group-hover:group-enabled:stroke-indigo-700/75",
  },
  purple: {
    badge: "bg-purple-100 text-purple-700",
    button: "enabled:hover:bg-purple-600/20",
    icon: "stroke-purple-700/50 group-hover:group-enabled:stroke-purple-700/75",
  },
  pink: {
    badge: "bg-pink-100 text-pink-700",
    button: "enabled:hover:bg-pink-600/20",
    icon: "stroke-pink-800/50 group-hover:group-enabled:stroke-pink-800/75",
  },
  primary: {
    badge: "bg-primary-100 text-primary-700",
    button: "enabled:hover:bg-primary-600/20",
    icon: "stroke-primary-700/50 group-hover:group-enabled:stroke-primary-700/75",
  },
  secondary: {
    badge: "bg-secondary-100 text-secondary-700",
    button: "enabled:hover:bg-secondary-600/20",
    icon: "stroke-secondary-700/50 group-hover:group-enabled:stroke-secondary-700/75",
  },
};

const PillBadge = <V,>({
  value,
  displayValue,
  color,
  isRemovable,
  onRemove,
  className,
  disabled = false,
}: PillBadgeProps<V>) => {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium",
        colorStyles[color].badge,
        className
      )}
    >
      {displayValue}
      {isRemovable && (
        <button
          type="button"
          onClick={() => onRemove?.(value)}
          className={classNames(
            "group relative -mr-1 h-3.5 w-3.5 rounded-xs",
            colorStyles[color].button
          )}
          disabled={disabled}
        >
          <span className="sr-only">Remove</span>
          <svg
            viewBox="0 0 14 14"
            className={classNames(
              "h-3.5 w-3.5 stroke-gray-700/50 group-hover:group-enabled:stroke-gray-700/75",
              colorStyles[color].icon
            )}
          >
            <title>Remove</title>
            <path d="M4 4l6 6m0-6l-6 6" />
          </svg>
          <span className="absolute -inset-1" />
        </button>
      )}
    </span>
  );
};

export default PillBadge;
