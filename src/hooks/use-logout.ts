import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "../contexts/auth/useAuth";

interface LogoutOptions {
  /** Where to land after KC clears the session. Defaults to the current origin. */
  redirectUri?: string;
}

/**
 * Returns a logout function that clears the TanStack Query cache before
 * handing off to Keycloak. The cache clear is defensive — today KC's
 * `logout({ redirectUri })` triggers a top-level redirect, which discards
 * all JS state including the query cache, so the leak this guards against
 * is latent. The moment logout moves to a SPA-routed flow (no full reload),
 * the cleared cache prevents the previous user's cached `/me`,
 * `users-with-access`, `access-rules`, etc. from rendering for whoever logs
 * in next on the same tab.
 *
 * See [threatzero-app#88](https://github.com/threatzero-solutions/threatzero-app/issues/88).
 */
export const useLogout = () => {
  const { keycloak } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    (options?: LogoutOptions) => {
      queryClient.clear();
      keycloak?.logout({
        redirectUri: options?.redirectUri ?? window.location.origin,
      });
    },
    [keycloak, queryClient],
  );
};
