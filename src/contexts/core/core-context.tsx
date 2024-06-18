import axios, { InternalAxiosRequestConfig } from "axios";
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
import { useAuth, withAuthenticationRequired } from "../AuthProvider";
import { createPortal } from "react-dom";
import SuccessNotice from "../../components/layouts/notices/SuccessNotice";

const TOKEN_MIN_VALIDATY_SECONDS = 2;

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

  interceptorReady: boolean;

  // OTHER
  hasPermissions: (
    requiredPermissions: string[],
    type?: "any" | "all"
  ) => boolean;
  accessTokenClaims?: { [key: string]: any } | null;

  setSuccess: (message?: string | null) => void;
}

export const CoreContext = createContext<CoreContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},
  hasPermissions: () => false,
  interceptorReady: false,
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
    const [interceptorReady, setInterceptorReady] = useState(false);

    const [state, dispatch] = useImmerReducer(coreReducer, INITIAL_STATE);

    const { accessToken, keycloak } = useAuth();

    useEffect(() => {
      if (!accessToken || !keycloak) {
        return;
      }

      axios.interceptors.request.use(
        async (config) => {
          try {
            await keycloak.updateToken(TOKEN_MIN_VALIDATY_SECONDS);
          } catch (e) {
            console.error("Update token failed", e);
          }

          const headers: Record<string, string> = {};
          if (!("x-local-noauth" in config.headers)) {
            headers["Authorization"] = `Bearer ${keycloak.token}`;
          }

          return {
            ...config,
            headers: {
              ...config.headers,
              ...headers,
            },
          } as InternalAxiosRequestConfig;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      axios.interceptors.response.use(
        (response) => {
          return response;
        },
        async (error) => {
          if (error.response && error.response.status === 401) {
            if (keycloak.isTokenExpired()) {
              await keycloak.login();
            }
          }
          return Promise.reject(error);
        }
      );
      setInterceptorReady(true);
    }, [accessToken, keycloak]);

    const hasPermissions = useCallback(
      (requiredPermissions: string[], type?: "any" | "all"): boolean => {
        const permissions =
          keycloak?.tokenParsed?.resource_access?.["threatzero-api"]?.roles;
        if (!permissions || !Array.isArray(permissions)) {
          return false;
        }

        const predicate = (p: string) => permissions.includes(p);
        switch (type) {
          case "all":
            return requiredPermissions.every(predicate);
          case "any":
          default:
            return requiredPermissions.some(predicate);
        }
      },
      [keycloak]
    );

    const setSuccess = (message?: string | null) => {
      if (message) {
        dispatch({ type: "SHOW_SUCCESS_MESSAGE", payload: message });
      } else {
        dispatch({ type: "DISMISS_SUCCESS_MESSAGE" });
      }
    };

    return (
      <CoreContext.Provider
        value={{
          state,
          dispatch,
          hasPermissions,
          interceptorReady,
          accessTokenClaims: keycloak?.tokenParsed,
          setSuccess,
        }}
      >
        {children}
        {createPortal(<SuccessNotice />, document.body)}
      </CoreContext.Provider>
    );
  });
