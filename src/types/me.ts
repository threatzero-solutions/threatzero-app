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
 * Where the user belongs — used for routing (e.g., safety-concern assignment)
 * and attribution (e.g., training-stats rollup). Independent of grants; a
 * user can have capabilities in units they don't reside in.
 *
 * `null` when the user has no residence (system admins, unenrolled users).
 */
export interface MeResidence {
  organizationId: string | null;
  unitId: string | null;
}

/**
 * Raw attribution claims from the Keycloak JWT — what the IdP says about
 * this user. Orthogonal to `residence` (DB-resolved with IDs) and to
 * grants. Useful when slug-level context is needed before DB sync (e.g.,
 * first-login window) or for display ("you are in Unit X" copy).
 */
export interface MeIdpClaims {
  organizationSlug: string | null;
  unitSlug: string | null;
  organizationUnitPath: string | null;
  peerUnits: string[];
}

export interface MeResponse {
  identity: MeIdentity;
  scope: MeScope;
  organization: MeOrganization | null;
  units: MeUnit[];
  capabilities: MeCapabilities;
  tat: MeTat;
  residence: MeResidence | null;
  idpClaims: MeIdpClaims;
}
