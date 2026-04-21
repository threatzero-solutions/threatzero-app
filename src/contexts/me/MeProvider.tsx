import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  CanAnyFn,
  CanFn,
  makeCan,
  makeCanAny,
  UnitTreeNode,
} from "../../auth/can";
import { getMe, ME_QUERY_KEY } from "../../queries/me";
import { getUnits } from "../../queries/organizations";
import { MeResponse } from "../../types/me";
import {
  DEFAULT_LABEL_BUNDLE,
  labelsForPreset,
  OrganizationLabelBundle,
} from "../../utils/labels";
import { useAuth } from "../auth/useAuth";
import { install403Interceptor } from "./install403Interceptor";

const FIVE_MINUTES = 5 * 60_000;
const TEN_MINUTES = 10 * 60_000;

export interface MeContextType {
  me: MeResponse | null | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  can: CanFn;
  /**
   * `canAny(cap)` — does the user hold `cap` anywhere (org-wide OR at any
   * granted unit)? Use for UX affordances like nav visibility where the
   * question is "can the user do this somewhere?" rather than "at a specific
   * unit?". Prefer `can()` with explicit `{ unitId }` for gating within a
   * specific context.
   */
  canAny: CanAnyFn;
  /** True while `me` has never loaded — callers should block permission gates. */
  isInitialLoading: boolean;
  // Derived convenience views — all consult `/me`, never the JWT.
  isGlobalAdmin: boolean;
  /** Slug of the user's single tenant org (null for system/personal scopes). */
  myOrganizationSlug?: string;
  /** Slug of the first known unit, if any. See note in `useMe()` docs. */
  myUnitSlug?: string;
  hasMultipleUnitAccess: boolean;
  /**
   * Today this matches `isGlobalAdmin` — system admins see all orgs. Single
   * org per user otherwise (decision §0.3 in the frontend plan).
   */
  hasMultipleOrganizationAccess: boolean;
  /**
   * Legacy-compat helper. Delegates to `can(...)` over capability slugs.
   * Prefer `can()` at new call sites.
   */
  hasPermissions: (capabilities: string[], type?: "any" | "all") => boolean;
  /**
   * Vocabulary bundle for the current organization (`unit*` and `team*`
   * labels). Always returns a bundle — falls back to the default
   * "Unit" / "Team" language when no organization is in scope (system
   * admin, personal scope, unauthenticated).
   */
  labels: OrganizationLabelBundle;
}

const defaultContext: MeContextType = {
  me: undefined,
  isLoading: false,
  error: null,
  refetch: async () => undefined,
  can: () => false,
  canAny: () => false,
  isInitialLoading: false,
  isGlobalAdmin: false,
  hasMultipleUnitAccess: false,
  hasMultipleOrganizationAccess: false,
  hasPermissions: () => false,
  labels: DEFAULT_LABEL_BUNDLE,
};

export const MeContext = createContext<MeContextType>(defaultContext);

export const MeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { authenticated, interceptorReady } = useAuth();
  const queryClient = useQueryClient();

  const enabled = authenticated && interceptorReady;

  const {
    data: me,
    isLoading,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled,
    staleTime: FIVE_MINUTES,
    refetchOnWindowFocus: true,
    refetchInterval: TEN_MINUTES,
  });

  // Load the organization-scoped unit tree so `can()` can resolve ancestor
  // inheritance. Shares the same query key pattern the OrganizationsContext
  // uses, so TanStack Query dedupes the request.
  const organizationId = me?.organization?.id;
  const { data: allUnits } = useQuery({
    queryKey: [
      "units",
      {
        "organization.id": organizationId,
        order: { createdTimestamp: "DESC" },
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[1]).then((units) => units.results),
    enabled: enabled && !!organizationId,
  });

  const unitTree = useMemo(() => {
    const map = new Map<string, UnitTreeNode>();
    (allUnits ?? []).forEach((unit) => {
      map.set(unit.id, { id: unit.id, parentUnitId: unit.parentUnitId });
    });
    return map;
  }, [allUnits]);

  const can = useMemo<CanFn>(() => {
    const baseCan = makeCan(me ?? null);
    return (capability, opts) =>
      baseCan(capability, { ...opts, unitTree: opts?.unitTree ?? unitTree });
  }, [me, unitTree]);

  const canAny = useMemo<CanAnyFn>(() => makeCanAny(me ?? null), [me]);

  const refetchCallback = useCallback(() => refetch(), [refetch]);

  // Re-fetch `/me` on auth gain (e.g. after first login) so the first render
  // past the splash has a fresh payload. TanStack Query kicks off on enable,
  // but we also invalidate so stale cache from a prior session doesn't linger.
  useEffect(() => {
    if (enabled) {
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    }
  }, [enabled, queryClient]);

  // Global 403 → /me refetch → one-shot retry.
  useEffect(() => {
    if (!interceptorReady) return undefined;
    return install403Interceptor(queryClient);
  }, [interceptorReady, queryClient]);

  const isGlobalAdmin = me?.scope.kind === "system";
  const myOrganizationSlug = me?.organization?.slug;
  const myUnitSlug = me?.units[0]?.slug;
  const hasMultipleUnitAccess = (me?.units.length ?? 0) > 1;
  // Single org per /me response (decision §0.3). System admins see all.
  const hasMultipleOrganizationAccess = isGlobalAdmin;
  const labels = useMemo(
    () => labelsForPreset(me?.organization?.labelPreset),
    [me?.organization?.labelPreset],
  );

  // hasPermissions is the legacy JWT-flat-roles shim. Pre-cutover roles were
  // granted at the user level (no unit scoping), so the faithful compat answer
  // is "does the user hold this anywhere?" — delegate to canAny.
  const hasPermissions = useCallback(
    (caps: string[], type: "any" | "all" = "any") => {
      const predicate = (c: string) => canAny(c);
      return type === "all" ? caps.every(predicate) : caps.some(predicate);
    },
    [canAny],
  );

  const value = useMemo<MeContextType>(
    () => ({
      me: me ?? undefined,
      isLoading,
      error,
      refetch: refetchCallback,
      can,
      canAny,
      isInitialLoading: enabled && isPending,
      isGlobalAdmin,
      myOrganizationSlug,
      myUnitSlug,
      hasMultipleUnitAccess,
      hasMultipleOrganizationAccess,
      hasPermissions,
      labels,
    }),
    [
      me,
      isLoading,
      isPending,
      error,
      refetchCallback,
      can,
      canAny,
      enabled,
      isGlobalAdmin,
      myOrganizationSlug,
      myUnitSlug,
      hasMultipleUnitAccess,
      hasMultipleOrganizationAccess,
      hasPermissions,
      labels,
    ],
  );

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
};

export const useMe = () => useContext(MeContext);

/** Convenience hook for gating UI on a single capability. */
export const useCan = () => useContext(MeContext).can;
