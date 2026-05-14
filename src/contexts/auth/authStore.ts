import Keycloak, {
  KeycloakConfig,
  KeycloakInitOptions,
  KeycloakTokenParsed,
} from "keycloak-js";
import configJson from "../../config";

/**
 * The Keycloak instance is a mutable external store: `.token`,
 * `.tokenParsed`, and `.authenticated` mutate in place as the SDK fires
 * lifecycle events. This module mirrors those mutations into an immutable
 * snapshot that React reads through `useSyncExternalStore` — replacing the
 * hand-rolled event-callback registry AuthProvider used to carry.
 *
 * Event handlers are wired once at module load (plain assignments, no side
 * effects). `init()` is kicked off lazily on the first React subscription
 * so importing this module in a test doesn't start an auth flow.
 */

export interface AuthSnapshot {
  /** True once Keycloak's `init()` has resolved successfully (`onReady`). */
  ready: boolean;
  authenticated: boolean;
  /** Current access token, or null when unauthenticated / expired. */
  token: string | null;
  /** Parsed identity claims from the access token. */
  tokenParsed: KeycloakTokenParsed | undefined;
  /** `init()` rejection or `onAuthError` payload, if any. */
  error: unknown;
}

export const keycloak = new Keycloak(
  configJson.keycloak.config as KeycloakConfig,
);

const initOptions: KeycloakInitOptions = {
  onLoad: "check-sso",
  pkceMethod: "S256",
  scope: "openid profile email",
  checkLoginIframe: false, // Login IFrame is increasingly unsupported in modern browsers.
  ...(configJson.keycloak.initOptions as KeycloakInitOptions),
};

let snapshot: AuthSnapshot = {
  ready: false,
  authenticated: false,
  token: null,
  tokenParsed: undefined,
  error: null,
};

const listeners = new Set<() => void>();
let initStarted = false;

function setSnapshot(patch: Partial<AuthSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) {
    listener();
  }
}

/** Read the live token/claims/auth flags off the (mutable) Keycloak instance. */
function readKeycloak(): Pick<
  AuthSnapshot,
  "authenticated" | "token" | "tokenParsed"
> {
  return {
    authenticated: !!keycloak.authenticated,
    token: keycloak.token ?? null,
    tokenParsed: keycloak.tokenParsed,
  };
}

keycloak.onReady = (authenticated) => {
  setSnapshot({
    ready: true,
    ...readKeycloak(),
    authenticated: !!authenticated,
  });
};
keycloak.onAuthSuccess = () => setSnapshot(readKeycloak());
keycloak.onAuthRefreshSuccess = () => setSnapshot(readKeycloak());
keycloak.onAuthLogout = () =>
  setSnapshot({ ...readKeycloak(), token: null, tokenParsed: undefined });
// Keycloak does not clear `.token` on expiry, so force it null here — the
// request interceptor refreshes (or drops the header) on the next call.
keycloak.onTokenExpired = () => setSnapshot({ ...readKeycloak(), token: null });
// Only patches `error` — an auth error must not disturb the live token
// fields the way the sibling handlers do.
keycloak.onAuthError = (error) => setSnapshot({ error });

function ensureInit(): void {
  if (initStarted) {
    return;
  }
  initStarted = true;
  keycloak.init(initOptions).catch((error) => setSnapshot({ error }));
}

export const authStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    ensureInit();
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): AuthSnapshot {
    return snapshot;
  },
  getServerSnapshot(): AuthSnapshot {
    return snapshot;
  },
};
