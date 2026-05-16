/**
 * Presentation-only helpers for role chips. Labels + descriptions come
 * from the backend via `GET /access/roles` (`useAssignableRoles`) — the
 * only role data we still keep FE-side is pure styling (chip color,
 * display order), because Tailwind classes and sort preferences don't
 * belong in the DB model.
 */

/**
 * Chip order — highest-privilege first so the most-relevant badge reads
 * left to right when a user has multiple roles.
 */
export const ROLE_DISPLAY_ORDER = [
  "system-admin",
  "organization-admin",
  "training-coordinator",
  "tat-member",
  "training-participant",
];

/**
 * Chip palette. Orange (primary) signals broad authority; secondary blue
 * for functional roles; neutral for participation-only roles. Red is
 * intentionally absent — see .impeccable.md ("no alarm theater").
 */
export const ROLE_CHIP_CLASS: Record<string, string> = {
  "system-admin": "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "organization-admin":
    "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "training-coordinator":
    "bg-secondary-100 text-secondary-800 ring-1 ring-secondary-200",
  "tat-member": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  "training-participant": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

export const DEFAULT_ROLE_CHIP_CLASS =
  "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

export const roleChipClass = (slug: string): string =>
  ROLE_CHIP_CLASS[slug] ?? DEFAULT_ROLE_CHIP_CLASS;

export const sortRoleSlugs = (slugs: string[]): string[] =>
  [...slugs].sort(
    (a, b) => ROLE_DISPLAY_ORDER.indexOf(a) - ROLE_DISPLAY_ORDER.indexOf(b),
  );
