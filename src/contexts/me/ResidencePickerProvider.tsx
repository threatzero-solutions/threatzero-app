import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import UnitPicker, { UnitOption } from "../../components/residence/UnitPicker";
import { useAuth } from "../auth/useAuth";
import { install422ResidenceInterceptor } from "./install422ResidenceInterceptor";

/**
 * Mounts the shared residence-unit picker as a global modal and registers
 * the axios 422 interceptor that opens it on `RESIDENCE_UNIT_REQUIRED`.
 *
 * Two consumers:
 *   1. The interceptor — fires automatically when any API call returns 422
 *      with the residence error code. The original request is retried on a
 *      successful pick, surfaces the 422 on cancel.
 *   2. Direct callers (e.g., the training watch page) — invoke
 *      `requireResidenceUnit(...)` from `useResidencePicker()` to gate a
 *      flow proactively, before the API call. Same picker, same callbacks.
 *
 * State is held with a `ref` to avoid re-rendering the modal whenever a
 * new picker request arrives — the latest pending request always replaces
 * the in-flight resolver.
 */

interface PickerRequest {
  organizationId: string;
  availableUnits: UnitOption[];
  dismissible: boolean;
  resolve: (result: { picked: true } | null) => void;
}

interface ResidencePickerContextValue {
  requireResidenceUnit: (input: {
    organizationId: string;
    availableUnits?: UnitOption[];
    dismissible?: boolean;
  }) => Promise<{ picked: true } | null>;
}

const ResidencePickerContext = createContext<ResidencePickerContextValue>({
  requireResidenceUnit: async () => null,
});

export const ResidencePickerProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { interceptorReady } = useAuth();
  const [request, setRequest] = useState<PickerRequest | null>(null);
  const requestRef = useRef<PickerRequest | null>(null);

  // Keep the ref in sync with state so the interceptor (which calls into a
  // stable callback) sees the latest request.
  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const requireResidenceUnit = useCallback<
    ResidencePickerContextValue["requireResidenceUnit"]
  >(({ organizationId, availableUnits, dismissible }) => {
    return new Promise((resolve) => {
      // If a request is already pending, resolve it as cancelled before
      // replacing it. Avoids leaking dangling promises.
      if (requestRef.current) {
        requestRef.current.resolve(null);
      }
      setRequest({
        organizationId,
        availableUnits: availableUnits ?? [],
        dismissible: dismissible ?? true,
        resolve,
      });
    });
  }, []);

  // Wire the axios interceptor once interceptors are ready (tokens flowing).
  useEffect(() => {
    if (!interceptorReady) return undefined;
    return install422ResidenceInterceptor(async (input) =>
      requireResidenceUnit({
        ...input,
        // 422 retries are blocking by design — the user must pick before
        // the original request can succeed.
        dismissible: true,
      }),
    );
  }, [interceptorReady, requireResidenceUnit]);

  const handleClose = useCallback((result: { picked: unknown } | null) => {
    const current = requestRef.current;
    if (!current) return;
    requestRef.current = null;
    setRequest(null);
    current.resolve(result ? { picked: true } : null);
  }, []);

  const value = useMemo<ResidencePickerContextValue>(
    () => ({ requireResidenceUnit }),
    [requireResidenceUnit],
  );

  return (
    <ResidencePickerContext.Provider value={value}>
      {children}
      {request && (
        <UnitPicker
          open
          organizationId={request.organizationId}
          availableUnits={
            request.availableUnits.length > 0
              ? request.availableUnits
              : undefined
          }
          dismissible={request.dismissible}
          onClose={handleClose}
        />
      )}
    </ResidencePickerContext.Provider>
  );
};

export const useResidencePicker = () => useContext(ResidencePickerContext);
