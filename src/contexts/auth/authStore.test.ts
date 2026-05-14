import { describe, expect, it, vi } from "vitest";

// `new Keycloak()` touches the DOM, so stand in a controllable fake. Each
// constructed instance carries the mutable token/auth fields the real SDK
// exposes; authStore wires its own `on*` handlers onto it.
vi.mock("keycloak-js", () => {
  const Keycloak = vi.fn(function (this: Record<string, unknown>) {
    this.authenticated = false;
    this.token = undefined;
    this.tokenParsed = undefined;
    this.init = vi.fn().mockResolvedValue(true);
  });
  return { default: Keycloak };
});

// authStore holds module-level state (snapshot, listeners, init guard), so
// each test re-imports it fresh.
const loadStore = async () => {
  vi.resetModules();
  return import("./authStore");
};

describe("authStore", () => {
  it("starts not-ready and unauthenticated", async () => {
    const { authStore } = await loadStore();
    expect(authStore.getSnapshot()).toEqual({
      ready: false,
      initFailed: false,
      authenticated: false,
      token: null,
      tokenParsed: undefined,
      error: null,
    });
  });

  it("returns a stable snapshot reference until an event fires", async () => {
    const { authStore } = await loadStore();
    expect(authStore.getSnapshot()).toBe(authStore.getSnapshot());
  });

  it("does not start init() until something subscribes", async () => {
    const { keycloak } = await loadStore();
    expect(keycloak.init).not.toHaveBeenCalled();
  });

  it("calls keycloak.init() exactly once across many subscriptions", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {})();
    authStore.subscribe(() => {})();
    authStore.subscribe(() => {})();
    expect(keycloak.init).toHaveBeenCalledTimes(1);
  });

  it("onReady publishes a ready snapshot and notifies listeners", async () => {
    const { authStore, keycloak } = await loadStore();
    const listener = vi.fn();
    authStore.subscribe(listener);

    keycloak.authenticated = true;
    keycloak.token = "tok-1";
    keycloak.tokenParsed = { email: "a@b.com" };
    keycloak.onReady?.(true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(authStore.getSnapshot()).toEqual({
      ready: true,
      initFailed: false,
      authenticated: true,
      token: "tok-1",
      tokenParsed: { email: "a@b.com" },
      error: null,
    });
  });

  it("onAuthSuccess publishes the token from a mid-flow login", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {});
    keycloak.onReady?.(false);

    keycloak.authenticated = true;
    keycloak.token = "tok-1";
    keycloak.onAuthSuccess?.();

    const snap = authStore.getSnapshot();
    expect(snap.authenticated).toBe(true);
    expect(snap.token).toBe("tok-1");
  });

  it("onAuthRefreshSuccess swaps in the new token with a fresh snapshot ref", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {});
    keycloak.token = "tok-1";
    keycloak.onReady?.(true);
    const first = authStore.getSnapshot();

    keycloak.token = "tok-2";
    keycloak.onAuthRefreshSuccess?.();
    const second = authStore.getSnapshot();

    expect(second).not.toBe(first);
    expect(second.token).toBe("tok-2");
  });

  it("onTokenExpired clears the token but keeps the authenticated flag", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {});
    keycloak.authenticated = true;
    keycloak.token = "tok-1";
    keycloak.onReady?.(true);

    keycloak.onTokenExpired?.();

    const snap = authStore.getSnapshot();
    expect(snap.token).toBeNull();
    expect(snap.authenticated).toBe(true);
  });

  it("onAuthLogout clears the token and identity claims", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {});
    keycloak.authenticated = true;
    keycloak.token = "tok-1";
    keycloak.tokenParsed = { email: "a@b.com" };
    keycloak.onReady?.(true);

    keycloak.authenticated = false;
    keycloak.token = undefined;
    keycloak.onAuthLogout?.();

    const snap = authStore.getSnapshot();
    expect(snap.token).toBeNull();
    expect(snap.tokenParsed).toBeUndefined();
    expect(snap.authenticated).toBe(false);
  });

  it("onAuthError records the error payload", async () => {
    const { authStore, keycloak } = await loadStore();
    authStore.subscribe(() => {});
    const err = { error: "access_denied", error_description: "nope" };
    keycloak.onAuthError?.(err);
    expect(authStore.getSnapshot().error).toBe(err);
  });

  it("stops notifying a listener once it unsubscribes", async () => {
    const { authStore, keycloak } = await loadStore();
    const listener = vi.fn();
    const unsubscribe = authStore.subscribe(listener);
    unsubscribe();

    keycloak.onAuthSuccess?.();

    expect(listener).not.toHaveBeenCalled();
  });

  it("captures an init() rejection as initFailed without marking ready", async () => {
    const { authStore, keycloak } = await loadStore();
    const boom = new Error("init failed");
    vi.mocked(keycloak.init).mockRejectedValueOnce(boom);

    authStore.subscribe(() => {});

    await vi.waitFor(() => {
      expect(authStore.getSnapshot().initFailed).toBe(true);
    });
    const snap = authStore.getSnapshot();
    expect(snap.error).toBe(boom);
    // `ready` stays false — the render gate keys on `initFailed` so the
    // app can show the error page instead of hanging on the splash.
    expect(snap.ready).toBe(false);
  });
});
