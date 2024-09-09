import { createContext, Dispatch, PropsWithChildren, useRef } from "react";
import { ImmerReducer, useImmerReducer } from "use-immer";
import ErrorNotice from "../../components/layouts/notices/ErrorNotice";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "../../pages/ErrorPage";

export interface ErrorState {
  errorMessage?: string | string[];
  showErrorMessage?: boolean;
}

export interface ErrorAction {
  type: string;
  payload?: any;
}

const INITIAL_STATE: ErrorState = {};

export interface ErrorContextType {
  // REDUCER
  state: ErrorState;
  dispatch: Dispatch<ErrorAction>;

  setError: (error?: string | string[] | null, timeout?: number) => void;
}

export const ErrorContext = createContext<ErrorContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},
  setError: () => {},
});

const coreReducer: ImmerReducer<ErrorState, ErrorAction> = (state, action) => {
  switch (action.type) {
    case "SHOW_ERROR_MESSAGE":
      state.errorMessage = action.payload;
      state.showErrorMessage = true;
      break;
    case "DISMISS_ERROR_MESSAGE":
      state.showErrorMessage = false;
      break;
  }
};

export const ErrorContextProvider: React.FC<PropsWithChildren<any>> = ({
  children,
}) => {
  const [state, dispatch] = useImmerReducer(coreReducer, INITIAL_STATE);
  const setErrorTimeout = useRef<number>();

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

  return (
    <ErrorContext.Provider value={{ state, dispatch, setError }}>
      <ErrorBoundary fallback={<ErrorPage />}>
        {children}
        {createPortal(<ErrorNotice />, document.body)}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
};
