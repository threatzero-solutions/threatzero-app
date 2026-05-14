import axios from "axios";
import Keycloak from "keycloak-js";

const TOKEN_MIN_VALIDITY_SECONDS = 2;

/**
 * Registers the auth request/response interceptors on the global axios
 * instance and returns an eject function. Sibling to
 * `install422ResidenceInterceptor` — same shape, same one-call contract.
 *
 * AuthProvider calls this exactly once. The earlier inline version re-ran
 * registration inside an effect keyed on `accessToken`, so every token
 * refresh stacked another (never-ejected) interceptor. The interceptor
 * reads `keycloak.token` live at request time, so it never needed to react
 * to token changes in the first place.
 *
 * Request interceptor:
 *  - Skips auth entirely for requests carrying the `x-local-noauth` header.
 *  - Refreshes the token if it is within `TOKEN_MIN_VALIDITY_SECONDS` of
 *    expiry. If the refresh fails, the request goes out WITHOUT an
 *    Authorization header rather than with the literal string
 *    `Bearer undefined` — the API rejects the latter as a malformed JWT
 *    ("Failed to decode JWT") instead of a clean 401.
 *
 * Response interceptor:
 *  - On a 401 with an expired token, kicks off the Keycloak login redirect.
 */
export const installAuthInterceptors = (keycloak: Keycloak): (() => void) => {
  const requestId = axios.interceptors.request.use(
    async (config) => {
      if (config.headers.has("x-local-noauth")) {
        return config;
      }

      try {
        await keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS);
      } catch (error) {
        console.error("Token refresh failed", error);
      }

      if (keycloak.token) {
        config.headers.set("Authorization", `Bearer ${keycloak.token}`);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  const responseId = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && keycloak.isTokenExpired()) {
        await keycloak.login();
      }
      return Promise.reject(error);
    },
  );

  return () => {
    axios.interceptors.request.eject(requestId);
    axios.interceptors.response.eject(responseId);
  };
};
