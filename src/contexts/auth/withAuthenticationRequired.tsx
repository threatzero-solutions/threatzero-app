import { PropsWithChildren, useEffect } from "react";
import { useAuth } from "./useAuth";
import SplashScreen from "../../components/layouts/SplashScreen";

export const withAuthenticationRequired =
  (Component: React.FC<PropsWithChildren>): React.FC =>
  (props: PropsWithChildren) => {
    const { authenticated, keycloak, interceptorReady } = useAuth();

    useEffect(() => {
      if (!authenticated && keycloak) {
        keycloak.login();
      }
    }, [keycloak, authenticated]);

    return (
      <>
        {authenticated && interceptorReady ? (
          <Component {...props} />
        ) : (
          <SplashScreen />
        )}
      </>
    );
  };
