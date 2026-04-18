/**
 * TanStack Query hooks wrapping `grants.ts`. Keeps the pure fetch
 * functions decoupled from React so they remain easy to test.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "./me";
import {
  DesiredGrantInput,
  getGrantAudit,
  getTatRoster,
  getUsersWithGrants,
  grantAuditKey,
  patchUserGrants,
  tatRosterKey,
  usersWithGrantsKey,
} from "./grants";

const FIVE_MINUTES = 5 * 60_000;

export const useUsersWithGrants = (orgId: string | undefined) =>
  useQuery({
    queryKey: orgId ? usersWithGrantsKey(orgId) : ["access", "users", "none"],
    queryFn: () => getUsersWithGrants(orgId!),
    enabled: !!orgId,
    staleTime: FIVE_MINUTES,
  });

export const useTatRoster = (orgId: string | undefined) =>
  useQuery({
    queryKey: orgId ? tatRosterKey(orgId) : ["access", "tat", "none"],
    queryFn: () => getTatRoster(orgId!),
    enabled: !!orgId,
    staleTime: FIVE_MINUTES,
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
