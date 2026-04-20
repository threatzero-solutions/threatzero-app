/**
 * Shared role display vocabulary for the Access surfaces. One source of
 * truth for role label, chip class, and display order keeps the assignment
 * table, editor, and audit log visually consistent.
 */

/**
 * Chip order — highest-privilege first so the most-relevant badge reads
 * left to right.
 */
export const ROLE_DISPLAY_ORDER = [
  "system-admin",
  "organization-admin",
  "training-admin",
  "tat-member",
  "training-participant",
];

export const ROLE_LABELS: Record<string, string> = {
  "system-admin": "System Admin",
  "organization-admin": "Org Admin",
  "training-admin": "Training Admin",
  "tat-member": "TAT",
  "training-participant": "Training Participant",
};

/**
 * Chip palette. Orange (primary) signals broad authority; secondary blue
 * for functional roles; neutral for participation-only roles. Red is
 * intentionally absent — see .impeccable.md ("no alarm theater").
 */
export const ROLE_CHIP_CLASS: Record<string, string> = {
  "system-admin": "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "organization-admin":
    "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "training-admin":
    "bg-secondary-100 text-secondary-800 ring-1 ring-secondary-200",
  "tat-member": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  "training-participant": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

export const DEFAULT_ROLE_CHIP_CLASS =
  "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

export const roleLabel = (slug: string): string => ROLE_LABELS[slug] ?? slug;

export const roleChipClass = (slug: string): string =>
  ROLE_CHIP_CLASS[slug] ?? DEFAULT_ROLE_CHIP_CLASS;

export const sortRoleSlugs = (slugs: string[]): string[] =>
  [...slugs].sort(
    (a, b) => ROLE_DISPLAY_ORDER.indexOf(a) - ROLE_DISPLAY_ORDER.indexOf(b),
  );
