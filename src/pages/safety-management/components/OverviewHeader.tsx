/**
 * Page-header overview for the Safety Management dashboards (Safety
 * Concerns / Threat Assessments / Violent Incident Log). Mirrors the
 * vocabulary of the user dashboard's `SafetyManagementCard → CountBlock`
 * but expands it from a card tile to an inline page header: big total
 * + accent, a row of status chips, and a row of "new since" trend
 * chips. No card surface — lives in the page's vertical rhythm.
 *
 * The chip palette comes from the dashboard tile:
 *   - amber:     attention statuses (new, in-progress)
 *   - secondary: action statuses (reviewed, ongoing)
 *   - muted:     terminal statuses (resolved, complete) + trend chips
 *
 * Pages assemble their own chip arrays from the per-record-type stats
 * shape so this component stays presentational.
 */
import React from "react";

type ChipTone = "amber" | "secondary" | "muted";

export interface OverviewChip {
  count: number;
  label: string;
  tone?: ChipTone;
}

const toneSurface: Record<ChipTone, string> = {
  amber: "bg-amber-50 ring-amber-200/70",
  secondary: "bg-secondary-50 ring-secondary-200",
  muted: "bg-warm-100 ring-warm-200",
};

const toneNum: Record<ChipTone, string> = {
  amber: "text-amber-900",
  secondary: "text-secondary-900",
  muted: "text-secondary-900",
};

const toneLabel: Record<ChipTone, string> = {
  amber: "text-amber-800",
  secondary: "text-secondary-700",
  muted: "text-secondary-600",
};

const Chip: React.FC<OverviewChip> = ({ count, label, tone = "muted" }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1",
      toneSurface[tone],
    ].join(" ")}
  >
    <span
      className={["text-sm font-bold tabular-nums", toneNum[tone]].join(" ")}
    >
      {count}
    </span>
    <span
      className={[
        "text-[10.5px] font-semibold uppercase tracking-wider",
        toneLabel[tone],
      ].join(" ")}
    >
      {label}
    </span>
  </span>
);

interface OverviewHeaderProps {
  total?: number;
  totalLabel: string;
  loading?: boolean;
  accent?: { count: number; label: string };
  statusChips?: OverviewChip[];
  trendChips?: OverviewChip[];
}

const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  total,
  totalLabel,
  loading,
  accent,
  statusChips,
  trendChips,
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
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={`t-${i}`}
              className="h-7 w-28 animate-pulse rounded-full bg-warm-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-4xl font-bold tabular-nums leading-none text-secondary-900">
          {total ?? 0}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
          {totalLabel}
        </span>
        {accent && accent.count > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            {accent.count} {accent.label}
          </span>
        )}
      </div>

      {statusChips && statusChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusChips.map((c, i) => (
            <Chip key={`status-${i}`} {...c} />
          ))}
        </div>
      )}

      {trendChips && trendChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trendChips.map((c, i) => (
            <Chip key={`trend-${i}`} tone="muted" {...c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OverviewHeader;
