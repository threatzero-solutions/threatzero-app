/**
 * TanStack Query hooks wrapping `grants.ts`. Keeps the pure fetch
 * functions decoupled from React so they remain easy to test.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "./me";
import {
  assignableRolesKey,
  DesiredGrantInput,
  getAssignableRoles,
  getGrantAudit,
  getTatRoster,
  getUsersWithAccess,
  grantAuditKey,
  patchUserGrants,
  tatRosterKey,
  UsersWithAccessQuery,
  usersWithGrantsKey,
} from "./grants";

// Short enough that a tab refocus after a KC-side edit (webhook-synced)
// picks up the change within a normal break-and-return cycle; long enough
// that rapidly switching tabs doesn't thrash the endpoint.
const THIRTY_SECONDS = 30_000;

/**
 * Merged Users+Access page. Query params flow through to the backend
 * and are embedded in the cache key so each filter combination caches
 * independently.
 */
export const useUsersWithAccess = (
  orgId: string | undefined,
  query: UsersWithAccessQuery = {},
) =>
  useQuery({
    queryKey: orgId
      ? [...usersWithGrantsKey(orgId), query]
      : ["access", "users", "none"],
    queryFn: () => getUsersWithAccess(orgId!, query),
    enabled: !!orgId,
    staleTime: THIRTY_SECONDS,
  });

export const useTatRoster = (orgId: string | undefined) =>
  useQuery({
    queryKey: orgId ? tatRosterKey(orgId) : ["access", "tat", "none"],
    queryFn: () => getTatRoster(orgId!),
    enabled: !!orgId,
    staleTime: THIRTY_SECONDS,
  });

/**
 * Role catalog for the admin role editor. Cached longer than other access
 * data — role definitions change with migrations, not day-to-day.
 */
export const useAssignableRoles = (orgId: string | undefined) =>
  useQuery({
    queryKey: orgId ? assignableRolesKey(orgId) : ["access", "roles", "none"],
    queryFn: () => getAssignableRoles(orgId!),
    enabled: !!orgId,
    staleTime: 30 * 60_000,
  });

export const useGrantAudit = (
  orgId: string | undefined,
  opts?: { userId?: string; limit?: number; offset?: number },
) =>
  useQuery({
    queryKey: orgId
      ? grantAuditKey(orgId, opts)
      : ["access", "audit", "none", opts ?? {}],
    queryFn: () => getGrantAudit(orgId!, opts),
    enabled: !!orgId,
    staleTime: 30_000,
  });

interface PatchInput {
  userId: string;
  grants: DesiredGrantInput[];
}

/**
 * Replace-with-set mutation. On success, refetches:
 *   - the org users list (to reflect the new grant set in the table)
 *   - the TAT roster (if the change touched tat-member grants)
 *   - the audit log (so recent changes appear)
 *   - /me (if the current viewer edited their own grants, permissions
 *     may have shifted — cheap to over-invalidate)
 */
export const usePatchUserGrants = (orgId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, grants }: PatchInput) => {
      if (!orgId) {
        throw new Error("orgId required for usePatchUserGrants");
      }
      return patchUserGrants(orgId, userId, grants);
    },
    onSuccess: () => {
      if (!orgId) return;
      queryClient.invalidateQueries({ queryKey: usersWithGrantsKey(orgId) });
      queryClient.invalidateQueries({ queryKey: tatRosterKey(orgId) });
      queryClient.invalidateQueries({ queryKey: ["access", "audit", orgId] });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
};
