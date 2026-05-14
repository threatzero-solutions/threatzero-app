import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Keycloak from "keycloak-js";
import { installAuthInterceptors } from "./installAuthInterceptors";

vi.mock("keycloak-js", () => ({ default: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

const requestUse = vi.mocked(axios.interceptors.request.use);
const requestEject = vi.mocked(axios.interceptors.request.eject);
const responseUse = vi.mocked(axios.interceptors.response.use);
const responseEject = vi.mocked(axios.interceptors.response.eject);

interface FakeKeycloak {
  token: string | undefined;
  updateToken: ReturnType<typeof vi.fn>;
  isTokenExpired: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
}

const makeKeycloak = (token: string | undefined): FakeKeycloak => ({
  token,
  updateToken: vi.fn().mockResolvedValue(true),
  isTokenExpired: vi.fn().mockReturnValue(false),
  login: vi.fn().mockResolvedValue(undefined),
});

const makeHeaders = (present: Record<string, unknown> = {}) => ({
  has: vi.fn((name: string) => name in present),
  set: vi.fn(),
});

const install = (keycloak: FakeKeycloak) =>
  installAuthInterceptors(keycloak as unknown as Keycloak);

// The interceptor callbacks registered with the mocked axios. Cast away
// the strict axios config typing — these tests drive them with minimal
// fakes that only carry the fields the interceptor actually touches.
type RequestFn = (config: {
  headers: ReturnType<typeof makeHeaders>;
}) => Promise<unknown>;
type ResponseErrorFn = (error: unknown) => Promise<unknown>;
const requestInterceptor = () =>
  requestUse.mock.calls.at(-1)![0] as unknown as RequestFn;
const responseErrorInterceptor = () =>
  responseUse.mock.calls.at(-1)![1] as unknown as ResponseErrorFn;

beforeEach(() => {
  vi.clearAllMocks();
  requestUse.mockReturnValue(101);
  responseUse.mockReturnValue(202);
});

describe("installAuthInterceptors", () => {
  it("registers exactly one request and one response interceptor", () => {
    install(makeKeycloak("tok-1"));
    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);
  });

  it("ejects both interceptors when the returned cleanup runs", () => {
    const eject = install(makeKeycloak("tok-1"));
    eject();
    expect(requestEject).toHaveBeenCalledWith(101);
    expect(responseEject).toHaveBeenCalledWith(202);
  });

  it("refreshes the token and attaches a Bearer header", async () => {
    const keycloak = makeKeycloak("tok-1");
    install(keycloak);
    const headers = makeHeaders();
    const config = { headers };

    const result = await requestInterceptor()(config);

    expect(keycloak.updateToken).toHaveBeenCalledWith(2);
    expect(headers.set).toHaveBeenCalledWith("Authorization", "Bearer tok-1");
    expect(result).toBe(config);
  });

  it("omits the header instead of sending `Bearer undefined` when there is no token", async () => {
    const keycloak = makeKeycloak(undefined);
    install(keycloak);
    const headers = makeHeaders();

    await requestInterceptor()({ headers });

    expect(headers.set).not.toHaveBeenCalled();
  });

  it("swallows an updateToken rejection and still omits the header", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const keycloak = makeKeycloak(undefined);
    keycloak.updateToken.mockRejectedValueOnce(new Error("refresh failed"));
    install(keycloak);
    const headers = makeHeaders();
    const config = { headers };

    await expect(requestInterceptor()(config)).resolves.toBe(config);
    expect(headers.set).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("skips auth entirely for requests carrying x-local-noauth", async () => {
    const keycloak = makeKeycloak("tok-1");
    install(keycloak);
    const headers = makeHeaders({ "x-local-noauth": true });
    const config = { headers };

    const result = await requestInterceptor()(config);

    expect(keycloak.updateToken).not.toHaveBeenCalled();
    expect(headers.set).not.toHaveBeenCalled();
    expect(result).toBe(config);
  });

  it("redirects to login on a 401 with an expired token", async () => {
    const keycloak = makeKeycloak("tok-1");
    keycloak.isTokenExpired.mockReturnValue(true);
    install(keycloak);
    const error = { response: { status: 401 } };

    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(keycloak.login).toHaveBeenCalledTimes(1);
  });

  it("does not redirect on a 401 when the token is still valid", async () => {
    const keycloak = makeKeycloak("tok-1");
    keycloak.isTokenExpired.mockReturnValue(false);
    install(keycloak);
    const error = { response: { status: 401 } };

    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(keycloak.login).not.toHaveBeenCalled();
  });

  it("passes non-401 errors through untouched", async () => {
    const keycloak = makeKeycloak("tok-1");
    install(keycloak);
    const error = { response: { status: 500 } };

    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(keycloak.login).not.toHaveBeenCalled();
  });
});
