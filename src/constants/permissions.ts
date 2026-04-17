/**
 * @deprecated After the DB-authorization cutover, these legacy permission
 * namespaces map 1:1 to capability slugs from `/api/me`. This module is kept
 * as a compatibility layer so existing call sites keep compiling; prefer
 * importing `CAP` from `./capabilities` at new call sites.
 *
 * Every constant here resolves to a string returned by the backend's
 * `MeService.resolveCapabilities`. Gate logic now lives in `can()` / the
 * `MeContext`, never in JWT decoding.
 */
import { CAP } from "./capabilities";

export const READ = {
  COURSES: CAP.VIEW_TRAINING,
  AUDIENCES: CAP.MANAGE_TRAINING_CONTENT,
  CHECKPOINTS: CAP.VIEW_TRAINING,
  FORMS: CAP.VIEW_FORMS,
  TIPS: CAP.VIEW_SAFETY_REPORTS,
  THREAT_ASSESSMENTS: CAP.VIEW_SAFETY_REPORTS,
  VIOLENT_INCIDENT_REPORTS: CAP.VIEW_SAFETY_REPORTS,
  ORGANIZATIONS: CAP.MANAGE_UNITS,
  ORGANIZATION_USERS: CAP.VIEW_ORG_USERS,
  ORGANIZATION_IDPS: CAP.VIEW_IDPS,
  ORGANIZATION_LMS_CONTENT: CAP.VIEW_LMS_CONTENT,
  COURSE_ENROLLMENTS: CAP.MANAGE_ENROLLMENTS,
  UNITS: CAP.MANAGE_UNITS,
  RESOURCES: CAP.VIEW_TRAINING,
  TRAINING_STATS: CAP.ADMINISTER_TRAINING,
} as const;

export const WRITE = {
  COURSES: CAP.MANAGE_TRAINING_CONTENT,
  AUDIENCES: CAP.MANAGE_TRAINING_CONTENT,
  FORMS: CAP.MANAGE_FORMS,
  TIPS: CAP.TRIAGE_SAFETY_REPORTS,
  THREAT_ASSESSMENTS: CAP.TRIAGE_SAFETY_REPORTS,
  VIOLENT_INCIDENT_REPORTS: CAP.TRIAGE_SAFETY_REPORTS,
  ORGANIZATIONS: CAP.MANAGE_UNITS,
  ORGANIZATION_USERS: CAP.MANAGE_ORG_USERS,
  ORGANIZATION_IDPS: CAP.MANAGE_IDPS,
  ORGANIZATION_LMS_CONTENT: CAP.MANAGE_LMS,
  COURSE_ENROLLMENTS: CAP.MANAGE_ENROLLMENTS,
  UNITS: CAP.MANAGE_UNITS,
  RESOURCES: CAP.MANAGE_RESOURCES,
  TRAINING_LINKS: CAP.ADMINISTER_TRAINING,
} as const;

export const LEVEL = {
  /**
   * System-admin bypass. Passing this to `hasPermissions()` — or checking
   * `useMe().isGlobalAdmin` — is the canonical "system admin only" gate.
   */
  ADMIN: CAP.MANAGE_SYSTEM,
  /** Legacy "any org-level user" marker. Prefer `useMe().me?.organization`. */
  ORGANIZATION: CAP.MANAGE_UNITS,
  /** Legacy "any unit-level user" marker. Prefer `useMe().me?.units`. */
  UNIT: CAP.MANAGE_UNITS,
} as const;
