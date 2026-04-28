/**
 * GET /api/me — frontend mirror of the backend DTO.
 *
 * Source of truth: `threatzero-api/src/auth/me/dto/me-response.dto.ts`.
 * Keep this file in lock-step with the backend interface. See
 * `threatzero-api/docs/db-authorization-cutover-plan.md §3.1` and
 * `_docs/authorization-model.md` for the conceptual model.
 *
 * Do NOT import types from the backend repo — this is the
 * frontend-owned shape.
 */

export interface MeIdentity {
  id: string;
  idpId: string | null;
  email: string;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  picture: string | null;
}

/**
 * Vocabulary preset an organization picks at setup time — drives the
 * "unit" / "team" label bundle the UI renders. Keep the literal union in
 * lock-step with `OrganizationLabelPreset` on the backend and with
 * `labelsForPreset()` in `utils/labels.ts`.
 */
export type MeOrganizationLabelPreset = "default" | "school" | "business";

export interface MeOrganization {
  id: string;
  slug: string;
  name: string;
  labelPreset: MeOrganizationLabelPreset;
}

export interface MeUnit {
  id: string;
  slug: string;
  name: string;
}

export interface MeScope {
  kind: "system" | "tenant" | "personal";
  /** Set iff `kind === 'tenant'`. */
  organizationId: string | null;
}

export interface MeCapabilities {
  /** Capability slugs granted across the whole organization in scope. */
  organization: string[];
  /**
   * Capability slugs granted per directly-granted unit. Excludes any slug
   * already present in `organization` (max-scope rule — org-level wins).
   * Inheritance through the unit tree is resolved client-side by `can()`.
   */
  units: Record<string /* unitId */, string[]>;
}

export interface MeTat {
  /** True when the user has an `organization-tat-member` grant. */
  organization: boolean;
  /** Unit IDs where the user has a `unit-tat-member` grant. */
  units: string[];
}

/**
 * One per-(user, org) residence — where the user belongs inside that org.
 * Used for routing (e.g., safety-concern assignment) and attribution
 * (e.g., training-stats rollup). Independent of grants; a user can have
 * capabilities in units they don't reside in.
 *
 * `unitId` is null when the user belongs to the org but hasn't picked a
 * unit yet — their next qualifying action triggers the residence picker.
 *
 * See `_docs/residence-and-tenant-model.md` §3 for the model.
 */
export interface MeResidence {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  unitId: string | null;
  unitSlug: string | null;
  unitName: string | null;
}

export interface MeResponse {
  identity: MeIdentity;
  scope: MeScope;
  organization: MeOrganization | null;
  units: MeUnit[];
  capabilities: MeCapabilities;
  tat: MeTat;
  /**
   * Every org the user has a residence row in. Empty when they have no
   * residence anywhere (pure system admins, unenrolled users).
   *
   * For the common single-residence case the array has exactly one entry.
   * Multi-residence is the multi-org future surface — admin-invite-only
   * for now.
   */
  residences: MeResidence[];
  /**
   * True when the user holds any system-scope grant. Authority is
   * orthogonal to `scope.kind` — a system admin acting inside a tenant
   * org has `scope.kind === 'tenant'` (per the backend's "system + ≥1
   * tenant grant → tenant" default) but still sees system-only UI. Gate
   * sysadmin surfaces on this, not on `scope.kind === 'system'`.
   */
  isSystemAdmin: boolean;
}
