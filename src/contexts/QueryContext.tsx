import {
  DefaultError,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PropsWithChildren, useContext, useState } from "react";
import { AlertContext } from "./alert/alert-context";
import { AxiosError } from "axios";
import { as } from "../utils/core";

const QueryContext: React.FC<PropsWithChildren> = ({ children }) => {
  const { setError } = useContext(AlertContext);

  const handleError = (error: DefaultError) => {
    console.error(error);
    if (error instanceof AxiosError && error.response?.status) {
      if (error.response.status >= 400 && error.response.status < 500) {
        const errMsgRaw =
          error.response?.data?.message ?? error.message ?? error;

        const cleanErrMsg = (err: unknown) => {
          return typeof err === "object"
            ? JSON.stringify(err, null, 2)
            : `${err}`.replace(/^./, (str) => str.toUpperCase());
        };

        const errMsg = Array.isArray(errMsgRaw)
          ? errMsgRaw.map(cleanErrMsg)
          : cleanErrMsg(errMsgRaw);

        setError(errMsg);
        return;
      }
    }

    setError("Oops! Something went wrong.");
  };

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
