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
import { findOneOrFail } from "./utils";

export interface UserWithGrants {
  id: string;
  idpId: string | null;
  email: string | null;
  grants: Array<{
    roleSlug: string;
    unitId: string | null;
    unitSlug: string | null;
  }>;
}

export interface TatMember {
  id: string;
  idpId: string | null;
  email: string | null;
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

export const getUsersWithGrants = (orgId: string) =>
  findOneOrFail<UserWithGrants[]>(accessPath(orgId, "/users"));

export const getTatRoster = (orgId: string) =>
  findOneOrFail<TatRoster>(accessPath(orgId, "/tat"));

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

export const patchUserGrants = async (
  orgId: string,
  userId: string,
  grants: DesiredGrantInput[],
): Promise<UserWithGrants["grants"]> => {
  const url = `${API_BASE_URL}/${accessPath(orgId, `/users/${userId}/grants`)}/`;
  const res = await axios.patch(url, { grants });
  // Server returns the user's full manual-grants array for this org; the
  // entity shape includes relation objects. Normalize to the trimmed
  // { roleSlug, unitId, unitSlug } shape we use everywhere else.
  const data = res.data as Array<{
    role?: { slug?: string };
    unitId: string | null;
    unit?: { slug?: string } | null;
  }>;
  return data
    .filter((g) => !!g.role?.slug)
    .map((g) => ({
      roleSlug: g.role!.slug!,
      unitId: g.unitId,
      unitSlug: g.unit?.slug ?? null,
    }));
};

// ---- TanStack Query key factories ----

export const usersWithGrantsKey = (orgId: string) =>
  ["access", "users", orgId] as const;
export const tatRosterKey = (orgId: string) =>
  ["access", "tat", orgId] as const;
export const grantAuditKey = (
  orgId: string,
  opts?: { userId?: string; limit?: number; offset?: number },
) => ["access", "audit", orgId, opts ?? {}] as const;
