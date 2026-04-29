import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { UnitOption } from "../../components/residence/UnitPicker";

/**
 * Axios response interceptor: on a 422 with body
 * `{ code: 'RESIDENCE_UNIT_REQUIRED', organizationId, availableUnits }`,
 * delegate to the registered `pickResidence` callback (which opens the
 * shared picker modal). When the user picks, retry the original request
 * exactly once. When the user cancels (callback resolves null), surface
 * the original 422 error to the caller.
 *
 * Sibling to `install403Interceptor` — same shape, same one-shot retry
 * flag pattern. See `_docs/residence-and-tenant-model.md` §5.
 */

const RETRY_FLAG = "__residenceRetry";

type FlaggedConfig = InternalAxiosRequestConfig & { [RETRY_FLAG]?: boolean };

interface ResidenceErrorBody {
  code?: string;
  organizationId?: string;
  availableUnits?: UnitOption[];
}

export interface PickResidenceFn {
  (input: {
    organizationId: string;
    availableUnits: UnitOption[];
  }): Promise<{ picked: true } | null>;
}

export const install422ResidenceInterceptor = (pick: PickResidenceFn) => {
  const id = axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ResidenceErrorBody>) => {
      const status = error.response?.status;
      const body = error.response?.data;
      const config = error.config as FlaggedConfig | undefined;

      if (
        status !== 422 ||
        body?.code !== "RESIDENCE_UNIT_REQUIRED" ||
        !body.organizationId ||
        !config ||
        config[RETRY_FLAG]
      ) {
        return Promise.reject(error);
      }

      const result = await pick({
        organizationId: body.organizationId,
        availableUnits: body.availableUnits ?? [],
      });

      if (!result) {
        // User dismissed the picker. Surface the original 422 so the
        // caller can decide how to recover (most callers will toast the
        // generic "couldn't save progress" message).
        return Promise.reject(error);
      }

      config[RETRY_FLAG] = true;
      return axios.request(config as AxiosRequestConfig);
    },
  );

  return () => axios.interceptors.response.eject(id);
};
