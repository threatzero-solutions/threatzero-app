import { useContext } from "react";
import { MeContext } from "../me/MeProvider";
import { AuthContext } from "./AuthProvider";

/**
 * Legacy-named hook that returns identity/token state from AuthContext plus
 * authorization-derived fields from MeContext. After the DB-authorization
 * cutover, permission data (`hasPermissions`, `isGlobalAdmin`, ...) is
 * sourced from `/api/me`, NOT the JWT — see `src/contexts/me/MeProvider.tsx`.
 *
 * Prefer `useMe()` at new call sites; `useAuth()` is kept as a compatibility
 * shim so existing components don't all need editing.
 */
export const useAuth = () => {
  const auth = useContext(AuthContext);
  const me = useContext(MeContext);
  return {
    ...auth,
    hasPermissions: me.hasPermissions,
    isGlobalAdmin: me.isGlobalAdmin,
    myOrganizationSlug: me.myOrganizationSlug,
    myUnitSlug: me.myUnitSlug,
    hasMultipleUnitAccess: me.hasMultipleUnitAccess,
    hasMultipleOrganizationAccess: me.hasMultipleOrganizationAccess,
    can: me.can,
  };
};
