/**
 * Status badge used in tables and detail views. Same chip family as
 * the OverviewHeader's filter chips (rounded-full, ring, brand-tinted
 * fill, uppercase + tracking) but at table-cell scale so it reads as
 * "metadata about this row" rather than "primary action".
 *
 * Tone semantics:
 *   - primary:   attention / actionable next step (e.g. "New",
 *                "In progress")
 *   - secondary: in-flight intermediate (e.g. "Reviewed",
 *                "Mgmt ongoing")
 *   - success:   terminal positive (e.g. "Resolved", "Complete")
 *   - muted:     unknown / fallback
 *
 * Per-record-type StatusPills wrap this with their own enum →
 * (label, tone) mapping. This component stays presentational.
 */
import React from "react";

export type StatusBadgeTone = "primary" | "secondary" | "success" | "muted";

interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
}

export const statusBadgeToneStyles: Record<StatusBadgeTone, string> = {
  primary: "bg-primary-50 ring-primary-200/70 text-primary-800",
  secondary: "bg-secondary-50 ring-secondary-200 text-secondary-700",
  success: "bg-success-50 ring-success-200 text-success-700",
  muted: "bg-warm-100 ring-warm-200 text-secondary-600",
};

export const statusBadgeBaseClass =
  "inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-inset text-[10.5px] font-semibold uppercase leading-none tracking-wider whitespace-nowrap";

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone }) => (
  <span
    className={[statusBadgeBaseClass, statusBadgeToneStyles[tone]].join(" ")}
  >
    {label}
  </span>
);

export default StatusBadge;
