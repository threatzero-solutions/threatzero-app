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
 */
const RequirePermissions: React.FC<RequirePermissionsOptions> = ({
  type = "any",
  permissions,
  fallbackTo,
  children,
}) => {
  const { me, isInitialLoading, can } = useMe();

  if (isInitialLoading || me === undefined) {
    return <div>Loading...</div>;
  }

  const predicate = (cap: string) => can(cap);
  const satisfied =
    type === "all" ? permissions.every(predicate) : permissions.some(predicate);

  if (satisfied) {
    return <Fragment>{children}</Fragment>;
  }
  return <Navigate to={fallbackTo ?? "/"} />;
};

export default RequirePermissions;
