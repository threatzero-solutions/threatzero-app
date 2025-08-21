import { Draft } from "immer";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useImmer } from "use-immer";
import Alert, { AlertVariant } from "../../components/layouts/alerts/Alert";
import ErrorPage from "../../pages/ErrorPage";

export interface TSetAlertReturn {
  alertId: number | string;
  close: () => void;
}

export interface AlertContextType {
  setAlert: (
    message: string | string[],
    options?: SetAlertOptions
  ) => TSetAlertReturn;
  setSuccess: (
    message: string | string[],
    options?: Omit<SetAlertOptions, "variant">
  ) => TSetAlertReturn;
  setError: (
    message: string | string[],
    options?: Omit<SetAlertOptions, "variant">
  ) => TSetAlertReturn;
  setInfo: (
    message: string | string[],
    options?: Omit<SetAlertOptions, "variant">
  ) => TSetAlertReturn;
  clearAlert: (id: number | string | null | undefined) => void;
  clearAllAlerts: () => void;
  getAlertId: () => number;
}

export const AlertContext = createContext<AlertContextType>({
  setAlert: () => ({ alertId: -1, close: () => {} }),
  setSuccess: () => ({ alertId: -1, close: () => {} }),
  setError: () => ({ alertId: -1, close: () => {} }),
  setInfo: () => ({ alertId: -1, close: () => {} }),
  clearAlert: () => {},
  clearAllAlerts: () => {},
  getAlertId: () => -1,
});

interface AlertOptions {
  id: number | string;
  variant: AlertVariant;
  message: string | string[];
}

interface SetAlertOptions {
  timeout?: number;
  id?: number | string;
  variant?: AlertVariant;
}

const createPortalRoot = () => {
  let el = document.getElementById("alert-portal");
  if (el === null) {
    el = document.createElement("div");
  }
  el.id = "alert-portal";
  document.body.appendChild(el);
  return el;
};

const removePortalRoot = () => {
  const el = document.getElementById("alert-portal");
  if (el) {
    document.body.removeChild(el);
  }
};

const AlertPortal: React.FC<
  PropsWithChildren<{ open: boolean; delay?: number }>
> = ({ children, open, delay = 0 }) => {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (open) {
      setInternalOpen(true);
    } else {
      setTimeout(() => {
        setInternalOpen(false);
      }, delay);
    }
  }, [open, delay]);

  if (internalOpen) {
    return createPortal(children, createPortalRoot());
  } else {
    removePortalRoot();
    return <></>;
  }
};

export const AlertContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const timeouts = useRef<Map<number | string, number>>(
    new Map<number | string, number>()
  );
  const [alerts, setAlerts] = useImmer<AlertOptions[]>([]);
  const atomicCounter = useRef(0);

  const getAlertId = () => atomicCounter.current++;

  const handleRemoveAlertByIdx =
    (idx: number) => (draft: Draft<AlertOptions[]>) => {
      const els = draft.splice(idx, 1);
      const id = els.pop()?.id;
      if (id) {
        clearTimeout(timeouts.current.get(id));
        timeouts.current.delete(id);
      }
    };

  const removeAlertByIdx = useCallback(
    (idx: number) => {
      setAlerts(handleRemoveAlertByIdx(idx));
    },
    [setAlerts]
  );

  const clearAlert = useCallback(
    (id: number | string | null | undefined) => {
      setAlerts((draft) => {
        const idx = draft.findIndex((a) => a.id === id);
        if (idx === -1) return;
        handleRemoveAlertByIdx(idx)(draft);
      });
    },
    [setAlerts]
  );

  const setAlert = useCallback(
    (message: string | string[], options: SetAlertOptions = {}) => {
      const alert: AlertOptions = {
        id: options.id ?? getAlertId(),
        variant: options.variant ?? "info",
        message,
      };

      setAlerts((draft) => {
        const idx = draft.findIndex((a) => a.id === alert.id);
        if (idx !== -1) {
          draft[idx] = alert;
          return;
        }
        draft.push(alert);
      });

      if (options.timeout) {
        if (timeouts.current.has(alert.id)) {
          clearTimeout(timeouts.current.get(alert.id));
        }
        timeouts.current.set(
          alert.id,
          window.setTimeout(() => {
            clearAlert(alert.id);
          }, options.timeout)
        );
      }

      return {
        alertId: alert.id,
        close: () => clearAlert(alert.id),
      };
    },
    [setAlerts, clearAlert]
  );

  const setSuccess = (
    message: string | string[],
    options: Omit<SetAlertOptions, "variant"> = {}
  ) => {
    return setAlert(message, {
      ...options,
      variant: "success",
    });
  };

  const setError = (
    message: string | string[],
    options: Omit<SetAlertOptions, "variant"> = {}
  ) => {
    return setAlert(message, {
      ...options,
      variant: "error",
    });
  };

  const setInfo = (
    message: string | string[],
    options: Omit<SetAlertOptions, "variant"> = {}
  ) => {
    return setAlert(message, {
      ...options,
      variant: "info",
    });
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <AlertContext.Provider
      value={{
        setAlert,
        setSuccess,
        setError,
        setInfo,
        clearAlert,
        clearAllAlerts,
        getAlertId,
      }}
    >
      <ErrorBoundary fallback={<ErrorPage />}>
        {children}
        <AlertPortal open={alerts.length > 0} delay={1000}>
          <div
            className="pointer-events-none fixed z-50 inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
            role="alertdialog"
            aria-live="assertive"
          >
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
              <AnimatePresence>
                {alerts.map(({ id, variant, message }, idx) => (
                  <Alert
                    key={id}
                    variant={variant}
                    message={message}
                    onClose={() => removeAlertByIdx(idx)}
                    as={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </AlertPortal>
        ,
      </ErrorBoundary>
    </AlertContext.Provider>
  );
};
