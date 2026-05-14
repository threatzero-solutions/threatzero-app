import {
  PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useNavigate } from "react-router";
import Keycloak from "keycloak-js";
import ErrorPage from "../../pages/ErrorPage";
import SplashScreen from "../../components/layouts/SplashScreen";
import { authStore, keycloak } from "./authStore";
import { installAuthInterceptors } from "./installAuthInterceptors";

const AuthCheck: React.FC<
  PropsWithChildren<{ keycloak: Keycloak; authError: unknown }>
> = ({ children, keycloak, authError }) => {
  const navigate = useNavigate();

  const isIgnorableError = (error: unknown): [boolean, string | undefined] => {
    if (error instanceof Error) {
      console.error("Error occurred during authentication: ", error);
      // TODO: Vestigial code from Auth0. May be useful in the future.
      // const errMsg = error.message.toLowerCase();
      // if (errMsg.includes("user does not belong to any organization")) {
      // 	return [false, "You do not belong to any organization."];
      // }
    }
    return [true, undefined];
  };

  useEffect(() => {
    if (authError) return;

    const checkAuth = () => {
      if (document.visibilityState === "visible" && !keycloak.authenticated) {
        navigate("/login");
      }
    };

    window.addEventListener("visibilitychange", checkAuth);

    return () => window.removeEventListener("visibilitychange", checkAuth);
  }, [keycloak, authError, navigate]);

  const [isIgnorableErr, friendlyMsg] = isIgnorableError(authError);

  return (
    <>
      {authError && !isIgnorableErr ? (
        <ErrorPage friendlyErrorMessage={friendlyMsg} />
      ) : (
        children
      )}
    </>
  );
};

/**
 * AuthContext scope is narrowed after the DB-authorization cutover:
 *  - keycloak / accessToken / authenticated: token lifecycle (still JWT-backed).
 *  - accessTokenClaims: identity fields only (email, name, picture, etc.).
 *  - interceptorReady: axios auth interceptor is ready to sign requests.
 *
 * Authorization state (permissions, roles, scope, my-org/unit) moved to
 * `MeContext` / `useMe()` and is sourced from `GET /api/me`. See
 * `threatzero-api/docs/db-authorization-cutover-plan.md §3.1` for the
 * frozen response shape and `_docs/authorization-model.md` for the model.
 *
 * Token/auth state is mirrored from the Keycloak instance via
 * `authStore` + `useSyncExternalStore`; see `./authStore.ts`.
 */
export interface AuthContextType {
  keycloak: Keycloak | null;
  authError: unknown;
  accessToken: string | null;
  authenticated: boolean;
  /**
   * Identity claims from the JWT — name, email, picture, given/family name.
   * NOT used for permissions, roles, org slug, or unit slug anymore.
   */
  accessTokenClaims?: { [key: string]: unknown } | null;
  interceptorReady: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  authError: null,
  accessToken: null,
  authenticated: false,
  interceptorReady: false,
});

const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  );
  const [interceptorReady, setInterceptorReady] = useState(false);

  useEffect(() => {
    const eject = installAuthInterceptors(keycloak);
    setInterceptorReady(true);
    return () => {
      eject();
      setInterceptorReady(false);
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      keycloak: snapshot.ready ? keycloak : null,
      authError: snapshot.error,
      accessToken: snapshot.token,
      authenticated: snapshot.authenticated,
      accessTokenClaims: snapshot.tokenParsed ?? null,
      interceptorReady,
    }),
    [snapshot, interceptorReady],
  );

  return (
    <AuthContext.Provider value={value}>
      {snapshot.ready ? (
        <AuthCheck keycloak={keycloak} authError={snapshot.error}>
          {children}
        </AuthCheck>
      ) : (
        <SplashScreen />
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
