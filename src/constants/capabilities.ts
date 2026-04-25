/**
 * Capability slugs — the canonical vocabulary `can()` checks against.
 *
 * Source of truth lives on the backend, in migrations:
 *   - `1775500000000-add-authorization-tables.ts`
 *   - `1775500000002-add-manage-system-capability.ts`
 *   - `1775500000003-add-view-lms-idps-capabilities.ts`
 *
 * These must stay in lock-step with the backend slugs. See
 * `threatzero-api/docs/db-authorization-cutover-plan.md §7` for the coverage
 * table mapping controllers → capabilities → seed roles.
 */
export const CAP = {
  MANAGE_SYSTEM: "manage-system",
  MANAGE_SYSTEM_USERS: "manage-system-users",

  MANAGE_ORGANIZATIONS: "manage-organizations",
  MANAGE_UNITS: "manage-units",
  MANAGE_ORG_USERS: "manage-org-users",
  VIEW_ORG_USERS: "view-org-users",
  MANAGE_ENROLLMENTS: "manage-enrollments",
  MANAGE_IDPS: "manage-idps",
  VIEW_IDPS: "view-idps",
  MANAGE_LMS: "manage-lms",
  VIEW_LMS_CONTENT: "view-lms-content",

  MANAGE_FORMS: "manage-forms",
  VIEW_FORMS: "view-forms",

  MANAGE_TRAINING_CONTENT: "manage-training-content",
  ADMINISTER_TRAINING: "administer-training",
  VIEW_TRAINING: "view-training",

  TRIAGE_SAFETY_REPORTS: "triage-safety-reports",
  VIEW_SAFETY_REPORTS: "view-safety-reports",

  MANAGE_RESOURCES: "manage-resources",
  MANAGE_LANGUAGES: "manage-languages",
} as const;

export type Capability = (typeof CAP)[keyof typeof CAP];
