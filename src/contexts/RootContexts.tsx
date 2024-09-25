import { PropsWithChildren } from "react";
import { CoreContextProvider } from "./core/core-context";
import { ErrorContextProvider } from "./error/error-context";
import { FormsContextProvider } from "./forms/forms-context";
import QueryContext from "./QueryContext";
import { TrainingContextProvider } from "./training/training-context";

export const RootContexts: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ErrorContextProvider>
      <QueryContext>
        <CoreContextProvider>
          <FormsContextProvider>
            <TrainingContextProvider>{children}</TrainingContextProvider>
          </FormsContextProvider>
        </CoreContextProvider>
      </QueryContext>
    </ErrorContextProvider>
  );
};
