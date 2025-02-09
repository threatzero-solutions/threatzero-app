import {
  DefaultError,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PropsWithChildren, useCallback, useContext, useState } from "react";
import { as, extractErrorMessage } from "../utils/core";
import { AlertContext } from "./alert/alert-context";
import { useAlertId } from "./alert/use-alert-id";

const QueryContext: React.FC<PropsWithChildren> = ({ children }) => {
  const { setError } = useContext(AlertContext);
  const defaultErrorAlertId = useAlertId();

  const handleError = useCallback(
    (error: DefaultError) => {
      console.error(error);
      const errMsg = extractErrorMessage(error);
      if (errMsg) {
        setError(errMsg, { id: defaultErrorAlertId });
        return;
      }

      setError("Oops! Something went wrong.", { id: defaultErrorAlertId });
    },
    [defaultErrorAlertId, setError]
  );

  const [queryClient] = useState(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: handleError,
      }),
      mutationCache: new MutationCache({
        onError: (error, _variables, context) => {
          if (as(context).skipOnError) return;
          handleError(error);
        },
      }),
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryContext;
