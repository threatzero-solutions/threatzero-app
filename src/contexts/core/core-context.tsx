import { createContext, Dispatch, PropsWithChildren, useRef } from "react";
import { NavigationItem } from "../../types/core";
import { ImmerReducer, useImmerReducer } from "use-immer";
import { withAuthenticationRequired } from "../AuthProvider";
import { createPortal } from "react-dom";
import SuccessNotice from "../../components/layouts/notices/SuccessNotice";

export interface CoreState {
  mainNavigationItems: NavigationItem[];
  successMessage?: string;
  showSuccessMessage?: boolean;
}

export interface CoreAction {
  type: string;
  payload?: any;
}

const INITIAL_STATE: CoreState = {
  mainNavigationItems: [],
};

export interface CoreContextType {
  // REDUCER
  state: CoreState;
  dispatch: Dispatch<CoreAction>;

  // OTHER
  setSuccess: (message?: string | null, timeout?: number) => void;
}

export const CoreContext = createContext<CoreContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},
  setSuccess: () => {},
});

const coreReducer: ImmerReducer<CoreState, CoreAction> = (state, action) => {
  switch (action.type) {
    case "SET_MAIN_NAVIGATION_ITEMS":
      state.mainNavigationItems = action.payload;
      break;
    case "SHOW_SUCCESS_MESSAGE":
      state.successMessage = action.payload;
      state.showSuccessMessage = true;
      break;
    case "DISMISS_SUCCESS_MESSAGE":
      state.showSuccessMessage = false;
      break;
  }
};

export const CoreContextProvider: React.FC<PropsWithChildren<any>> =
  withAuthenticationRequired(({ children }) => {
    const [state, dispatch] = useImmerReducer(coreReducer, INITIAL_STATE);
    const setSuccessTimeout = useRef<number>();

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

    return (
      <CoreContext.Provider
        value={{
          state,
          dispatch,
          setSuccess,
        }}
      >
        {children}
        {createPortal(<SuccessNotice />, document.body)}
      </CoreContext.Provider>
    );
  });
