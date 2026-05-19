import { Fragment, PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { useMe } from "../contexts/me/MeProvider";

export interface RequirePermissionsOptions extends PropsWithChildren {
  /** 'any' (default) passes if any capability matches; 'all' requires all. */
  type?: "any" | "all";
  /** Capability slugs (see `src/constants/capabilities.ts`). */
  permissions: string[];
  fallbackTo?: string;
}

/**
 * Capability-aware route guard. Capabilities come from `/api/me`, not the
 * JWT. While `/me` is still loading we render "Loading..." rather than
 * bouncing, so a stale cache redirect doesn't fire during refresh.
 *
 * The "can I enter this page at all" question is intentionally
 * unit-inclusive: a unit-only grantee (e.g., a unit-admin scoped to a
 * single school) should reach `/my-organization/*` and see the surfaces
 * their unit-scoped caps cover. `canAny` is the right call here —
 * `can()` checks org-wide only and would bounce unit-only grantees
 * despite legitimate access (app#86). Per-surface scoping inside each
 * page is handled by the page's own `can()` / `canAny()` checks.
 */
const RequirePermissions: React.FC<RequirePermissionsOptions> = ({
  type = "any",
  permissions,
  fallbackTo,
  children,
}) => {
  const { me, isInitialLoading, canAny } = useMe();

  if (isInitialLoading || me === undefined) {
    return <div>Loading...</div>;
  }

  const predicate = (cap: string) => canAny(cap);
  const satisfied =
    type === "all" ? permissions.every(predicate) : permissions.some(predicate);

  if (satisfied) {
    return <Fragment>{children}</Fragment>;
  }
  return <Navigate to={fallbackTo ?? "/"} />;
};

export default RequirePermissions;
