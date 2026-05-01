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
  reason?: string;
  resolve: (result: { picked: true } | null) => void;
}

interface ResidencePickerContextValue {
  requireResidenceUnit: (input: {
    organizationId: string;
    availableUnits?: UnitOption[];
    dismissible?: boolean;
    /**
     * Trigger-specific copy explaining why the picker is up. Surfaced as
     * the modal's primary descriptive line. Falls back to a warm generic
     * default when omitted.
     */
    reason?: string;
  }) => Promise<{ picked: true } | null>;
  /**
   * True while the picker modal is currently open. Consumers (e.g., the
   * training watch page) use this to coordinate their own underlying-page
   * state — e.g., suppressing redundant gate copy while the modal is up.
   */
  isPickerOpen: boolean;
}

const ResidencePickerContext = createContext<ResidencePickerContextValue>({
  requireResidenceUnit: async () => null,
  isPickerOpen: false,
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
  >(({ organizationId, availableUnits, dismissible, reason }) => {
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
        reason,
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
    () => ({ requireResidenceUnit, isPickerOpen: request !== null }),
    [requireResidenceUnit, request],
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
          reason={request.reason}
          onClose={handleClose}
        />
      )}
    </ResidencePickerContext.Provider>
  );
};

export const useResidencePicker = () => useContext(ResidencePickerContext);
