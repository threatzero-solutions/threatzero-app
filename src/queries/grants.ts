/**
 * Queries + mutations against the DB-native access-management endpoints
 * (threatzero-api `AccessManagementController`, plan: role-tat-management-plan.md).
 *
 * These power the consolidated role editor and TAT roster views. The admin
 * UI is now the sole writer of MANUAL AccessGrant rows; Keycloak groups and
 * the KC→DB sync task no longer participate in authorization decisions.
 */
import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import type { MeResidence } from "../types/me";
import { findOneOrFail } from "./utils";

/**
 * Provenance of a single AccessGrant. Mirrors the backend `ProvenanceEnum`.
 * The role editor uses this to disable controls on rule- and SSO-derived
 * grants (those are projections of their source, not directly editable).
 */
export type GrantSource = "manual" | "rule" | "sso";

/**
 * One row in the merged Users + Access list. Mirrors `UserWithAccessDto`
 * on the backend. Carries KC identity + the user's full effective grants
 * (manual, rule, and SSO) scoped to the organization being listed. See
 * `_docs/users-access-merge-plan.md`.
 */
export interface UserWithAccess {
  idpId: string;
  /**
   * DB `UserRepresentation.id`. Required for grant mutations via
   * `PATCH /access/users/:userId/grants`. `null` when the user exists in
   * KC but hasn't triggered a rep creation yet (never logged into the
   * app). The role editor renders disabled in that case.
   */
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  unitSlug: string | null;
  audienceSlugs: string[];
  groups: string[];
  grants: Array<{
    roleSlug: string;
    unitId: string | null;
    unitSlug: string | null;
    /**
     * Where the grant came from. `'manual'` is admin-set and editable from
     * this UI. `'rule'` and `'sso'` are projections of an upstream source
     * — surfaced for visibility so admins see the user's full effective
     * access, but the editor disables direct mutation (the API would
     * reject, and even if it didn't the source would re-materialize).
     */
    source: GrantSource;
  }>;
  /**
   * True when the user holds the system-admin role. Read-only in the org
   * module — system-admin is granted/revoked from the dedicated Admin
   * Panel page so org-admin sessions can't accidentally fan privilege
   * out across tenants.
   */
  isSystemAdmin: boolean;
}

/**
 * Extends the shared `ItemFilterQueryParams` so `DataTable2` can drive the
 * Users tab directly (sort + paginate via `query`/`setQuery`). The backend
 * only validates `firstName | lastName | email | unit` as sort keys
 * (see `OrganizationUserQueryOrderDto`), but we keep the type permissive
 * to match the shared contract.
 */
export interface UsersWithAccessQuery extends ItemFilterQueryParams {
  /** Filter KC users by unit slug (matches the KC `unit` attribute). */
  unit?: string | string[];
  audience?: string | string[];
  enabled?: boolean;
}

export interface PaginatedUsersWithAccess {
  limit: number;
  offset: number;
  count: number;
  pageCount: number;
  results: UserWithAccess[];
}

export interface TatMember {
  id: string;
  idpId: string | null;
  email: string | null;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  unitId: string | null;
  unitSlug: string | null;
}

export interface TatRoster {
  organization: TatMember[];
  units: Record<string, TatMember[]>;
}

export interface DesiredGrantInput {
  roleSlug: string;
  /** Omit for org-scope grants (organization/tenant roles with unitId null). */
  unitId?: string;
}

export interface GrantAuditEntry {
  id: string;
  createdOn: string;
  grantId: string | null;
  userId: string;
  roleId: string;
  organizationId: string | null;
  unitId: string | null;
  action: "granted" | "revoked";
  actorUserId: string | null;
  actorReason: string | null;
  user?: { id: string; email: string | null };
  actor?: { id: string; email: string | null } | null;
  role?: { id: string; slug: string; name: string };
  unit?: { id: string; slug: string; name: string } | null;
}

/**
 * Role metadata the admin role editor consumes (mirrors `AssignableRole`
 * on the API). `allowedScopes` drives which roles land in the org-wide
 * checkbox list vs. the unit picker — replaces the old hardcoded
 * `ORG_SCOPE_ROLES` / `UNIT_SCOPE_ROLES` arrays that used to drift from
 * the backend's scope enforcement.
 */
export interface AssignableRole {
  slug: string;
  name: string;
  description: string;
  allowedScopes: Array<"organization" | "unit">;
  capabilities: string[];
}

export interface PaginatedGrantAudit {
  count: number;
  limit: number;
  offset: number;
  pageCount: number;
  results: GrantAuditEntry[];
}

// ---- URL helpers ----

const accessPath = (orgId: string, sub = "") =>
  `organizations/organizations/${orgId}/access${sub}`;

// ---- Fetch fns (for TanStack Query) ----

export const getUsersWithAccess = (
  orgId: string,
  query: UsersWithAccessQuery = {},
) => {
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));
  if (query.search) params.set("search", query.search);
  if (query.enabled != null) params.set("enabled", String(query.enabled));
  if (query.unit != null) {
    const units = Array.isArray(query.unit) ? query.unit : [query.unit];
    units.forEach((u) => params.append("unit", u));
  }
  if (query.audience != null) {
    const aud = Array.isArray(query.audience)
      ? query.audience
      : [query.audience];
    aud.forEach((a) => params.append("audience", a));
  }
  if (query.order) {
    for (const [k, v] of Object.entries(query.order)) {
      if (v) params.set(`order[${k}]`, v);
    }
  }
  const qs = params.toString();
  return findOneOrFail<PaginatedUsersWithAccess>(
    accessPath(orgId, "/users") + (qs ? `?${qs}` : ""),
  );
};

export const getTatRoster = (orgId: string) =>
  findOneOrFail<TatRoster>(accessPath(orgId, "/tat"));

export const getAssignableRoles = (orgId: string) =>
  findOneOrFail<AssignableRole[]>(accessPath(orgId, "/roles"));

export const getGrantAudit = (
  orgId: string,
  opts?: { userId?: string; limit?: number; offset?: number },
) => {
  const params = new URLSearchParams();
  if (opts?.userId) params.set("userId", opts.userId);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return findOneOrFail<PaginatedGrantAudit>(
    accessPath(orgId, "/audit") + (qs ? `?${qs}` : ""),
  );
};

export const deleteTatMember = async (
  orgId: string,
  userId: string,
  unitId: string | null,
): Promise<void> => {
  const qs = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  const url = `${API_BASE_URL}/${accessPath(orgId, `/tat/users/${userId}`)}${qs}`;
  await axios.delete(url);
};

/**
 * One non-blocking warning the server emits when a manual revoke is shadowed
 * by a rule- or SSO-sourced grant. The manual row was deleted as requested,
 * but the user retains the capability via the shadowing source. Surface in
 * the role editor so the admin can edit the underlying rule (or accept the
 * shadow as intentional).
 */
export interface ShadowedRevoke {
  roleSlug: string;
  roleName: string;
  unitId: string | null;
  unitSlug: string | null;
  shadowedBy: "rule" | "sso";
}

export interface PatchUserGrantsResult {
  grants: UserWithAccess["grants"];
  shadowedRevokes: ShadowedRevoke[];
}

/**
 * Admin-set residence endpoint response (api#59). Returns the persisted
 * residence row plus cascade counts so the Move-to-Unit modal can render a
 * post-save summary describing exactly how many manual grants followed the
 * user to the new unit. `setMyResidence` (self-pick) returns the bare
 * `MeResidence` shape — the cascade only fires on admin-driven moves.
 */
export interface AdminSetResidenceResponse {
  residence: MeResidence;
  cascade: { moved: number; deduped: number };
}

export const adminSetUserResidence = async (
  orgId: string,
  userId: string,
  unitId: string | null,
): Promise<AdminSetResidenceResponse> => {
  const url = `${API_BASE_URL}/${accessPath(orgId, `/users/${userId}/residence`)}/`;
  const res = await axios.put(url, { unitId });
  return res.data as AdminSetResidenceResponse;
};

export const patchUserGrants = async (
  orgId: string,
  userId: string,
  grants: DesiredGrantInput[],
): Promise<PatchUserGrantsResult> => {
  const url = `${API_BASE_URL}/${accessPath(orgId, `/users/${userId}/grants`)}/`;
  const res = await axios.patch(url, { grants });
  // Server returns `{ grants: AccessGrant[], shadowedRevokes: [...] }`.
  // Normalize the grant entities to the trimmed `{ roleSlug, unitId,
  // unitSlug }` shape used everywhere else.
  const data = res.data as {
    grants: Array<{
      role?: { slug?: string };
      unitId: string | null;
      unit?: { slug?: string } | null;
      source?: GrantSource;
    }>;
    shadowedRevokes: ShadowedRevoke[];
  };
  const grantsOut = data.grants
    .filter((g) => !!g.role?.slug)
    .map((g) => ({
      roleSlug: g.role!.slug!,
      unitId: g.unitId,
      unitSlug: g.unit?.slug ?? null,
      // PATCH only writes manual grants; legacy responses without `source`
      // are safely defaulted so older API versions don't break the type.
      source: g.source ?? "manual",
    }));
  return { grants: grantsOut, shadowedRevokes: data.shadowedRevokes ?? [] };
};

// ---- TanStack Query key factories ----

export const usersWithGrantsKey = (orgId: string) =>
  ["access", "users", orgId] as const;
export const tatRosterKey = (orgId: string) =>
  ["access", "tat", orgId] as const;
export const assignableRolesKey = (orgId: string) =>
  ["access", "roles", orgId] as const;
export const grantAuditKey = (
  orgId: string,
  opts?: { userId?: string; limit?: number; offset?: number },
) => ["access", "audit", orgId, opts ?? {}] as const;
