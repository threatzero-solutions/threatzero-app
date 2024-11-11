import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { NavigationItem } from "../../types/core";
import { ImmerReducer, useImmerReducer } from "use-immer";
import ConfirmationModal, {
  ConfirmationModalProps,
} from "../../components/layouts/modal/ConfirmationModal";
import { withAuthenticationRequired } from "../auth/withAuthenticationRequired";
import { useEventListener, useLocalStorage } from "usehooks-ts";

export interface CoreState {
  mainNavigationItems: NavigationItem[];
  confirmationOptions: Omit<ConfirmationModalProps, "open" | "setOpen">;
  isPrimaryTab: boolean;
}

export interface CoreAction {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

const INITIAL_STATE: CoreState = {
  mainNavigationItems: [],
  confirmationOptions: {
    title: "",
    message: "",
    onConfirm: () => {},
  },
  isPrimaryTab: false,
};

export interface CoreContextType {
  // REDUCER
  state: CoreState;
  dispatch: Dispatch<CoreAction>;

  // OTHER
  setConfirmationOpen: (
    confirmationOptions: Omit<ConfirmationModalProps, "open" | "setOpen">
  ) => void;
  setConfirmationClose: () => void;
}

export const CoreContext = createContext<CoreContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},
  setConfirmationOpen: () => {},
  setConfirmationClose: () => {},
});

const coreReducer: ImmerReducer<CoreState, CoreAction> = (state, action) => {
  switch (action.type) {
    case "SET_MAIN_NAVIGATION_ITEMS":
      state.mainNavigationItems = action.payload;
      break;
    case "SET_CONFIRMATION_OPTIONS":
      state.confirmationOptions = action.payload;
      break;
    case "SET_IS_PRIMARY_TAB":
      state.isPrimaryTab = action.payload;
      break;
  }
};

const tabId = Math.random().toString(36).substring(2, 9);

export const CoreContextProvider: React.FC<PropsWithChildren> =
  withAuthenticationRequired(({ children }) => {
    const [state, dispatch] = useImmerReducer(coreReducer, INITIAL_STATE);

    const [primaryTabId, setPrimaryTabId] = useLocalStorage<string | null>(
      "threatzero.core.primary-tab-id",
      null
    );
    const unregisterTab = useCallback(() => {
      if (primaryTabId === tabId) {
        setPrimaryTabId(null);
      }
    }, [primaryTabId, setPrimaryTabId]);
    useEventListener("beforeunload", unregisterTab);

    const [confirmationOpen, setConfirmationOpen] = useState(false);

    const handleSetConfirmationOpen = (
      confirmationOptions: Omit<ConfirmationModalProps, "open" | "setOpen">
    ) => {
      setConfirmationOpen(true);
      dispatch({
        type: "SET_CONFIRMATION_OPTIONS",
        payload: confirmationOptions,
      });
    };

    useEffect(() => {
      let thisIsPrimaryTab = false;
      if (primaryTabId === null) {
        setPrimaryTabId(tabId);
        thisIsPrimaryTab = true;
      } else {
        thisIsPrimaryTab = primaryTabId === tabId;
      }

      dispatch({
        type: "SET_IS_PRIMARY_TAB",
        payload: thisIsPrimaryTab,
      });
    }, [primaryTabId, dispatch, setPrimaryTabId]);

    useEffect(() => {
      return () => {
        unregisterTab();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <CoreContext.Provider
        value={{
          state,
          dispatch,
          setConfirmationOpen: handleSetConfirmationOpen,
          setConfirmationClose: () => setConfirmationOpen(false),
        }}
      >
        {children}
        <ConfirmationModal
          {...state.confirmationOptions}
          open={confirmationOpen}
          setOpen={setConfirmationOpen}
        />
      </CoreContext.Provider>
    );
  });
