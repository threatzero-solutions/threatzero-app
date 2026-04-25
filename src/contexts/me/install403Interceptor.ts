import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { QueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "../../queries/me";

/**
 * Axios response interceptor: on a 403, refetch `/me` once then retry the
 * failing request exactly once. A second 403 on the same request surfaces
 * through normally. We mark the request config with a one-shot flag so
 * retries don't loop forever and so independent requests each get their own
 * retry budget.
 *
 * Returns an eject function; caller is responsible for cleanup on unmount.
 */
const RETRY_FLAG = "__meRefetched403Retry";

type FlaggedConfig = InternalAxiosRequestConfig & { [RETRY_FLAG]?: boolean };

export const install403Interceptor = (queryClient: QueryClient) => {
  const id = axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const config = error.config as FlaggedConfig | undefined;

      if (status !== 403 || !config || config[RETRY_FLAG]) {
        return Promise.reject(error);
      }

      config[RETRY_FLAG] = true;

      try {
        // Refetch the latest capability set, then retry the failing request.
        await queryClient.refetchQueries({ queryKey: ME_QUERY_KEY });
      } catch {
        // If /me itself fails, fall through to surfacing the original 403.
        return Promise.reject(error);
      }

      return axios.request(config as AxiosRequestConfig);
    },
  );

  return () => axios.interceptors.response.eject(id);
};
