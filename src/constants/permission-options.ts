/**
 * Re-expressed in capability slugs (from `/api/me`) instead of legacy JWT
 * permission strings. The option-object shape (`permissions`, optional
 * `type: 'any' | 'all'`) is unchanged so existing nav/guard call sites keep
 * working — the contents are just capability slugs now.
 *
 * Map derived from `threatzero-api/docs/db-authorization-cutover-plan.md §7`
 * (capability coverage table). See `src/constants/capabilities.ts` for the
 * canonical slug list.
 */
import { CAP } from "./capabilities";

// TRAINING
export const trainingLibraryPermissionsOptions = {
  permissions: [CAP.VIEW_TRAINING],
};

export const trainingItemPermissionsOptions = {
  permissions: [CAP.VIEW_TRAINING],
};

export const courseBuilderPermissionsOptions = {
  permissions: [CAP.MANAGE_TRAINING_CONTENT],
};

// FORMS
export const formBuilderPermissionsOptions = {
  permissions: [CAP.MANAGE_FORMS],
};

// SAFETY MANAGEMENT
export const safetyManagementPermissionOptions = {
  type: "any" as const,
  permissions: [CAP.VIEW_SAFETY_REPORTS, CAP.ADMINISTER_TRAINING],
};

export const safetyConcernPermissionsOptions = {
  permissions: [CAP.VIEW_SAFETY_REPORTS],
};

export const threatAssessmentPermissionsOptions = {
  permissions: [CAP.VIEW_SAFETY_REPORTS],
};

export const violentIncidentReportPermissionsOptions = {
  permissions: [CAP.VIEW_SAFETY_REPORTS],
};

export const trainingAdminPermissionOptions = {
  permissions: [CAP.ADMINISTER_TRAINING],
  type: "any" as const,
};

// RESOURCES
export const resourcePermissionsOptions = {
  permissions: [CAP.VIEW_TRAINING],
};

// ADMIN PANEL
export const adminPanelPermissionOptions = {
  permissions: [CAP.MANAGE_SYSTEM],
  type: "all" as const,
};

// MY ORGANIZATION — any user belonging to a tenant org can view. We express
// this as "has manage-units OR view-org-users OR org scope" — for the guard
// path, `MANAGE_UNITS` is the most common org-admin cap, but anyone with a
// tenant scope should see their org page. Handled by the guard via a fallback
// on `me.organization !== null`; the slug list below gates the nav-link.
export const myOrganizationPermissionOptions = {
  permissions: [CAP.MANAGE_UNITS, CAP.VIEW_ORG_USERS, CAP.MANAGE_ORG_USERS],
  type: "any" as const,
};

export const organizationUserPermissionOptions = {
  permissions: [CAP.VIEW_ORG_USERS],
  type: "all" as const,
};

export const organizationTrainingManagementPermissionOptions = {
  permissions: [CAP.MANAGE_ENROLLMENTS, CAP.MANAGE_ORG_USERS],
  type: "any" as const,
};

export const organizationSafetyManagementPermissionOptions = {
  permissions: [CAP.MANAGE_UNITS],
  type: "all" as const,
};

export const organizationSettingsPermissionOptions = {
  permissions: [CAP.MANAGE_UNITS],
  type: "all" as const,
};
