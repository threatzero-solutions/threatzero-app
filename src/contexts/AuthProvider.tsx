import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import configJson from "../config";
import { useNavigate } from "react-router-dom";
import ErrorPage from "../pages/ErrorPage";
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from "keycloak-js";

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

export interface AuthContextType {
  keycloak: Keycloak | null;
  authError: unknown;
  accessToken: string | null;
  authenticated: boolean;
  addEventListener: (
    event: string,
    cb: (kc: Keycloak, ...args: any[]) => void
  ) => void;
}

export const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  authError: null,
  accessToken: null,
  authenticated: false,
  addEventListener: () => {},
});

export const useAuth = () => useContext(AuthContext);

const _keycloak = new Keycloak(configJson.keycloak.config as KeycloakConfig);

const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<unknown>();
  const kcInitializing = useRef(false);

  const eventCallbacks = new Map<
    string,
    Set<(kc: Keycloak, ...args: any[]) => void>
  >();

  const addEventListener = (
    event: string,
    cb: (kc: Keycloak, ...args: any[]) => void
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

  const _onReady = (kc: Keycloak, authenticated: any) => {
    setKeycloak(kc);
    setAuthenticated(!!authenticated);
  };

  const _onError = (_: Keycloak, error: unknown) => {
    setAuthError(error);
  };

  const handleEvent =
    (event: string, kc: Keycloak) =>
    (...args: any[]) => {
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
      _keycloak
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

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authError,
        accessToken,
        authenticated,
        addEventListener,
      }}
    >
      {keycloak && (
        <AuthCheck keycloak={keycloak} authError={authError}>
          {children}
        </AuthCheck>
      )}
    </AuthContext.Provider>
  );
};

export const withAuthenticationRequired =
  (Component: React.FC<PropsWithChildren>): React.FC =>
  (props: PropsWithChildren) => {
    const { authenticated, keycloak } = useAuth();

    useEffect(() => {
      if (!authenticated && keycloak) {
        keycloak.login();
      }
    }, [keycloak, authenticated]);

    return <>{authenticated && <Component {...props} />}</>;
  };

export default AuthProvider;
