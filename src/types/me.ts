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

export interface MeOrganization {
  id: string;
  slug: string;
  name: string;
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

export interface MeResponse {
  identity: MeIdentity;
  scope: MeScope;
  organization: MeOrganization | null;
  units: MeUnit[];
  capabilities: MeCapabilities;
  tat: MeTat;
}
