import {
  PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import configJson from "../../config";
import { useNavigate } from "react-router";
import ErrorPage from "../../pages/ErrorPage";
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from "keycloak-js";
import axios, { InternalAxiosRequestConfig } from "axios";
import SplashScreen from "../../components/layouts/SplashScreen";

const TOKEN_MIN_VALIDATY_SECONDS = 2;

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

    const checkAuth = async () => {
      if (document.visibilityState === "visible" && !keycloak.authenticated) {
        navigate("/login");
      }
    };

    window.addEventListener("visibilitychange", checkAuth);

    return () => window.removeEventListener("visibilitychange", checkAuth);
  });

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
 */
export interface AuthContextType {
  keycloak: Keycloak | null;
  authError: unknown;
  accessToken: string | null;
  authenticated: boolean;
  addEventListener: (
    event: string,
    cb: (kc: Keycloak, ...args: unknown[]) => void,
  ) => void;
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
  addEventListener: () => {},
  interceptorReady: false,
});

const _keycloak = new Keycloak(configJson.keycloak.config as KeycloakConfig);

const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<unknown>();
  const [interceptorReady, setInterceptorReady] = useState(false);
  const kcInitializing = useRef(false);

  const eventCallbacks = new Map<
    string,
    Set<(kc: Keycloak, ...args: unknown[]) => void>
  >();

  const addEventListener = (
    event: string,
    cb: (kc: Keycloak, ...args: unknown[]) => void,
  ) => {
    if (!eventCallbacks.has(event)) {
      eventCallbacks.set(event, new Set<() => void>());
    }
    eventCallbacks.get(event)?.add(cb);
  };

  const _newAccessToken = (kc: Keycloak) => {
    setAccessToken(kc.token ?? null);
    setAuthenticated(!!kc.authenticated);
  };

  const _revokeAccessToken = (kc: Keycloak) => {
    setAccessToken(null);
    setAuthenticated(!!kc.authenticated);
  };

  const _onReady = (kc: Keycloak, authenticated: unknown) => {
    setKeycloak(kc);
    setAuthenticated(!!authenticated);
  };

  const _onError = (_: Keycloak, error: unknown) => {
    setAuthError(error);
  };

  const handleEvent =
    (event: string, kc: Keycloak) =>
    (...args: unknown[]) => {
      eventCallbacks.get(event)?.forEach((cb) => {
        cb(kc, ...args);
      });
    };

  useEffect(() => {
    addEventListener("onReady", _onReady);

    // New token events
    addEventListener("newToken", _newAccessToken);
    addEventListener("onAuthSuccess", _newAccessToken);
    addEventListener("onAuthRefreshSuccess", _newAccessToken);

    // Logout events
    addEventListener("onAuthLogout", _revokeAccessToken);
    addEventListener("onTokenExpired", _revokeAccessToken);

    // Error events
    addEventListener("onAuthError", _onError);

    _keycloak.onReady = handleEvent("onReady", _keycloak);
    _keycloak.onAuthSuccess = handleEvent("onAuthSuccess", _keycloak);
    _keycloak.onAuthRefreshSuccess = handleEvent(
      "onAuthRefreshSuccess",
      _keycloak,
    );
    _keycloak.onAuthLogout = handleEvent("onAuthLogout", _keycloak);
    _keycloak.onTokenExpired = handleEvent("onTokenExpired", _keycloak);
    _keycloak.onActionUpdate = handleEvent("onActionUpdate", _keycloak);
    _keycloak.onAuthError = handleEvent("onAuthError", _keycloak);

    if (!kcInitializing.current) {
      kcInitializing.current = true;
      _keycloak
        .init({
          onLoad: "check-sso",
          pkceMethod: "S256",
          scope: "openid profile email",
          checkLoginIframe: false, // Login IFrame is increasingly unsupported in modern browsers.
          ...(configJson.keycloak.initOptions as KeycloakInitOptions),
        })
        .catch((e) => setAuthError(e));
    }
  });

  useEffect(() => {
    if (!accessToken || !keycloak) {
      return;
    }

    axios.interceptors.request.use(
      async (config) => {
        try {
          await keycloak.updateToken(TOKEN_MIN_VALIDATY_SECONDS);
        } catch (e) {
          console.error("Update token failed", e);
        }

        const headers: Record<string, string> = {};
        if (!("x-local-noauth" in config.headers)) {
          headers["Authorization"] = `Bearer ${keycloak.token}`;
        }

        return {
          ...config,
          headers: {
            ...config.headers,
            ...headers,
          },
        } as InternalAxiosRequestConfig;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response && error.response.status === 401) {
          if (keycloak.isTokenExpired()) {
            await keycloak.login();
          }
        }
        return Promise.reject(error);
      },
    );
    setInterceptorReady(true);
  }, [accessToken, keycloak]);

  const accessTokenClaims = useMemo(() => keycloak?.tokenParsed, [keycloak]);

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authError,
        accessToken,
        authenticated,
        addEventListener,
        accessTokenClaims,
        interceptorReady,
      }}
    >
      {keycloak ? (
        <AuthCheck keycloak={keycloak} authError={authError}>
          {children}
        </AuthCheck>
      ) : (
        <SplashScreen />
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
