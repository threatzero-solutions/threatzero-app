import { createContext, Dispatch, PropsWithChildren, useRef } from "react";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ImmerReducer, useImmerReducer } from "use-immer";
import ErrorNotice from "../../components/layouts/notices/ErrorNotice";
import InfoNotice from "../../components/layouts/notices/InfoNotice";
import SuccessNotice from "../../components/layouts/notices/SuccessNotice";
import ErrorPage from "../../pages/ErrorPage";

export interface AlertState {
  errorMessage?: string | string[];
  showErrorMessage?: boolean;
  successMessage?: string;
  showSuccessMessage?: boolean;
  infoMessage?: string;
  showInfoMessage?: boolean;
}

export interface AlertAction {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

const INITIAL_STATE: AlertState = {};

export interface AlertContextType {
  // REDUCER
  state: AlertState;
  dispatch: Dispatch<AlertAction>;

  setError: (error?: string | string[] | null, timeout?: number) => void;
  setSuccess: (message?: string | null, timeout?: number) => void;
  setInfo: (message?: string | null, timeout?: number) => void;
}

export const AlertContext = createContext<AlertContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},
  setError: () => {},
  setSuccess: () => {},
  setInfo: () => {},
});

const coreReducer: ImmerReducer<AlertState, AlertAction> = (state, action) => {
  switch (action.type) {
    case "SHOW_ERROR_MESSAGE":
      state.errorMessage = action.payload;
      state.showErrorMessage = true;
      break;
    case "DISMISS_ERROR_MESSAGE":
      state.showErrorMessage = false;
      break;
    case "SHOW_SUCCESS_MESSAGE":
      state.successMessage = action.payload;
      state.showSuccessMessage = true;
      break;
    case "DISMISS_SUCCESS_MESSAGE":
      state.showSuccessMessage = false;
      break;
    case "SHOW_INFO_MESSAGE":
      state.infoMessage = action.payload;
      state.showInfoMessage = true;
      break;
    case "DISMISS_INFO_MESSAGE":
      state.showInfoMessage = false;
      break;
  }
};

const alertRoot = document.getElementById("alert-root") ?? document.body;

export const AlertContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useImmerReducer(coreReducer, INITIAL_STATE);
  const setErrorTimeout = useRef<number>();
  const setSuccessTimeout = useRef<number>();
  const setInfoTimeout = useRef<number>();

  const setError = (error?: string | string[] | null, timeout?: number) => {
    if (error) {
      dispatch({
        type: "SHOW_ERROR_MESSAGE",
        payload: error,
      });
    } else {
      dispatch({ type: "DISMISS_ERROR_MESSAGE" });
    }

    if (timeout) {
      if (setErrorTimeout.current) {
        clearTimeout(setErrorTimeout.current);
      }
      setErrorTimeout.current = window.setTimeout(() => {
        dispatch({ type: "DISMISS_ERROR_MESSAGE" });
      }, timeout);
    }
  };

  const setSuccess = (message?: string | null, timeout?: number) => {
    if (message) {
      dispatch({ type: "SHOW_SUCCESS_MESSAGE", payload: message });
    } else {
      dispatch({ type: "DISMISS_SUCCESS_MESSAGE" });
    }

    if (timeout) {
      if (setSuccessTimeout.current) {
        clearTimeout(setSuccessTimeout.current);
      }
      setSuccessTimeout.current = window.setTimeout(() => {
        dispatch({ type: "DISMISS_SUCCESS_MESSAGE" });
      }, timeout);
    }
  };

  const setInfo = (message?: string | null, timeout?: number) => {
    if (message) {
      dispatch({ type: "SHOW_INFO_MESSAGE", payload: message });
    } else {
      dispatch({ type: "DISMISS_INFO_MESSAGE" });
    }

    if (timeout) {
      if (setInfoTimeout.current) {
        clearTimeout(setInfoTimeout.current);
      }
      setInfoTimeout.current = window.setTimeout(() => {
        dispatch({ type: "DISMISS_INFO_MESSAGE" });
      }, timeout);
    }
  };

  return (
    <AlertContext.Provider
      value={{ state, dispatch, setError, setSuccess, setInfo }}
    >
      <ErrorBoundary fallback={<ErrorPage />}>
        {children}
        {createPortal(<SuccessNotice />, alertRoot)}
        {createPortal(<InfoNotice />, alertRoot)}
        {createPortal(<ErrorNotice />, alertRoot)}
      </ErrorBoundary>
    </AlertContext.Provider>
  );
};
