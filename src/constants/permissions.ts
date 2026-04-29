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
  /**
   * @deprecated Legacy "any org-level user" marker. The underlying intent is
   * *scope*, not *capability* — it originally meant "this user is scoped to
   * an organization," not "this user can manage units." No call sites use
   * this standalone today (audit, 2026-04). The compat mapping to
   * `CAP.MANAGE_UNITS` exists only so any future stray reference keeps
   * compiling; it is deliberately strict. At new call sites, check
   * `useMe().me?.scope.kind === 'tenant'` — see
   * `db-authorization-frontend-plan.md §C.2`.
   */
  ORGANIZATION: CAP.MANAGE_UNITS,
  /**
   * @deprecated Legacy "any unit-level user" marker. Same story as
   * `LEVEL.ORGANIZATION`: the compat mapping to `CAP.MANAGE_UNITS` is strict
   * and there are no standalone call sites today. If you need "user has
   * access to at least one unit," check `useMe().me?.units.length > 0`. If
   * you need "user is scoped to a tenant," use `scope.kind === 'tenant'`.
   */
  UNIT: CAP.MANAGE_UNITS,
} as const;
