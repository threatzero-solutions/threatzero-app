import { motion } from "motion/react";
import { ReactNode } from "react";
import { classNames } from "../../utils/core";

// Named tint palettes. Kept as full class strings so Tailwind's JIT can
// see them. Text color pairs with each tint so the active pill feels
// like one object, not a box around adjacent text.
const TINTS = {
  primary: {
    pill: "bg-primary-50 ring-1 ring-primary-200/80",
    text: "text-primary-800",
  },
  emerald: {
    pill: "bg-emerald-50 ring-1 ring-emerald-200/80",
    text: "text-emerald-800",
  },
  secondary: {
    pill: "bg-secondary-50 ring-1 ring-secondary-200/80",
    text: "text-secondary-800",
  },
  neutral: {
    pill: "bg-white shadow-xs ring-1 ring-gray-900/5",
    text: "text-gray-900",
  },
} as const;

export type SegmentedTint = keyof typeof TINTS;

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Color the active pill uses when this option is selected. Default "neutral". */
  tint?: SegmentedTint;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (v: T) => void;
  /** Shared layoutId so only siblings in the same group animate together. */
  groupId: string;
  size?: "md" | "sm";
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  groupId,
  size = "md",
  ariaLabel,
}: SegmentedProps<T>) {
  const activeTint =
    TINTS[options.find((o) => o.value === value)?.tint ?? "neutral"];
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative inline-flex flex-wrap items-stretch rounded-md bg-gray-100 p-0.5"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={classNames(
              "relative rounded",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            )}
          >
            {active && (
              <motion.span
                layoutId={groupId}
                className={classNames(
                  "absolute inset-0 rounded",
                  activeTint.pill,
                )}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span
              className={classNames(
                "relative whitespace-nowrap",
                active ? `${activeTint.text} font-medium` : "text-gray-600",
              )}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
