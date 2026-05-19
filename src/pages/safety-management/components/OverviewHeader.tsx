/**
 * Page-header overview for the Safety Management dashboards (Safety
 * Concerns / Threat Assessments / Violent Incident Log). Inline, no
 * card: lives in the page's vertical rhythm.
 *
 * Composition: big tabular total + brand-orange accent ("12 new"),
 * a row of status chips that act as quick filters, and a quiet inline
 * "Last 7d/30d/90d" line below.
 *
 * The chip palette echoes the user dashboard's SafetyManagementCard
 * tile:
 *   - amber:     attention statuses (new, in-progress)
 *   - secondary: action statuses (reviewed, ongoing)
 *   - muted:     terminal statuses (resolved, complete)
 *
 * Chips become interactive when `onChipClick` is provided; the page
 * wires that to the DataTable's status filter so clicking "New"
 * filters the table to status=new. The currently-active filter
 * value (if any) is passed as `activeKey` and gets a pressed style.
 *
 * Trend counts are rendered inline (not as chips) so they visually
 * demote from "stats you might act on" to "metadata about the total".
 */
import React from "react";

type ChipTone = "primary" | "info" | "success" | "secondary" | "muted";

export interface OverviewChip {
  count: number;
  label: string;
  tone?: ChipTone;
  /**
   * When set, the chip becomes a filter button keyed off this value.
   * Pass an array to collapse multiple equivalent statuses into one
   * chip (e.g. Complete + Closed Superficial Threat → one "Complete"
   * chip that filters to either).
   */
  value?: string | string[];
}

export interface OverviewTrend {
  count: number;
  label: string;
}

const toneSurface: Record<ChipTone, string> = {
  primary: "bg-primary-50 ring-primary-200/70",
  info: "bg-info-50 ring-info-200",
  success: "bg-success-50 ring-success-200",
  secondary: "bg-secondary-50 ring-secondary-200",
  muted: "bg-warm-100 ring-warm-200",
};

const toneSurfaceActive: Record<ChipTone, string> = {
  primary: "bg-primary-100 ring-primary-400",
  info: "bg-info-100 ring-info-400",
  success: "bg-success-100 ring-success-400",
  secondary: "bg-secondary-100 ring-secondary-400",
  muted: "bg-warm-200 ring-warm-400",
};

const toneSurfaceHover: Record<ChipTone, string> = {
  primary: "hover:bg-primary-100/70 hover:ring-primary-300",
  info: "hover:bg-info-100/70 hover:ring-info-300",
  success: "hover:bg-success-100/70 hover:ring-success-300",
  secondary: "hover:bg-secondary-100/70 hover:ring-secondary-300",
  muted: "hover:bg-warm-200/70 hover:ring-warm-300",
};

const toneNum: Record<ChipTone, string> = {
  primary: "text-primary-900",
  info: "text-info-700",
  success: "text-success-700",
  secondary: "text-secondary-900",
  muted: "text-secondary-900",
};

const toneLabel: Record<ChipTone, string> = {
  primary: "text-primary-800",
  info: "text-info-700",
  success: "text-success-700",
  secondary: "text-secondary-700",
  muted: "text-secondary-600",
};

interface ChipProps extends OverviewChip {
  active?: boolean;
  onClick?: () => void;
}

const Chip: React.FC<ChipProps> = ({
  count,
  label,
  tone = "muted",
  active,
  onClick,
}) => {
  const className = [
    "inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-inset transition-colors",
    active ? toneSurfaceActive[tone] : toneSurface[tone],
    onClick && !active ? toneSurfaceHover[tone] : "",
    onClick
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span
        className={[
          "min-w-[1.25rem] text-center text-sm font-bold leading-none tabular-nums",
          toneNum[tone],
        ].join(" ")}
      >
        {count}
      </span>
      <span
        className={[
          "text-[10.5px] font-semibold uppercase leading-none tracking-wider",
          toneLabel[tone],
        ].join(" ")}
      >
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={className}
      >
        {content}
      </button>
    );
  }
  return <span className={className}>{content}</span>;
};

interface OverviewHeaderProps {
  total?: number;
  /** Small context label after the number, e.g. "all-time" or "this org". */
  totalContext?: string;
  loading?: boolean;
  statusChips?: OverviewChip[];
  /** Chip value matching the active filter, so a chip can render pressed. */
  activeStatus?: string | string[];
  /** Toggle: pass undefined to clear; pass a new value or array to set. */
  onStatusChange?: (next: string | string[] | undefined) => void;
  trends?: OverviewTrend[];
}

const sameValue = (
  a: string | string[] | undefined,
  b: string | string[] | undefined,
): boolean => {
  if (a === undefined || b === undefined) return a === b;
  const arrA = Array.isArray(a) ? [...a].sort() : [a];
  const arrB = Array.isArray(b) ? [...b].sort() : [b];
  if (arrA.length !== arrB.length) return false;
  return arrA.every((v, i) => v === arrB[i]);
};

const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  total,
  totalContext,
  loading,
  statusChips,
  activeStatus,
  onStatusChange,
  trends,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <div className="h-10 w-24 animate-pulse rounded bg-warm-200/70" />
          <div className="h-3 w-20 animate-pulse rounded bg-warm-200/50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={`s-${i}`}
              className="h-7 w-28 animate-pulse rounded-full bg-warm-100"
            />
          ))}
        </div>
        <div className="h-3 w-64 animate-pulse rounded bg-warm-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-4xl font-bold tabular-nums leading-none text-secondary-900">
          {total ?? 0}
        </span>
        {totalContext && (
          <span className="text-xs font-medium uppercase tracking-wider text-secondary-500">
            {totalContext}
          </span>
        )}
      </div>

      {statusChips && statusChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusChips.map((c) => {
            const active = !!c.value && sameValue(c.value, activeStatus);
            const handleClick =
              onStatusChange && c.value
                ? () => onStatusChange(active ? undefined : c.value)
                : undefined;
            const key = Array.isArray(c.value)
              ? c.value.join("+")
              : (c.value ?? c.label);
            return (
              <Chip key={key} {...c} active={active} onClick={handleClick} />
            );
          })}
        </div>
      )}

      {trends && trends.length > 0 && (
        <p className="text-xs text-secondary-500">
          {trends.map((t, i) => (
            <span key={t.label}>
              {i > 0 && (
                <span aria-hidden="true" className="mx-2 text-secondary-300">
                  ·
                </span>
              )}
              <span>{t.label}: </span>
              <span className="font-semibold tabular-nums text-secondary-700">
                {t.count}
              </span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

export default OverviewHeader;
