import { PropsWithChildren } from "react";
import { CoreContextProvider } from "./core/core-context";
import { AlertContextProvider } from "./alert/alert-context";
import { FormsContextProvider } from "./forms/forms-context";
import QueryContext from "./QueryContext";
import { TrainingContextProvider } from "./training/training-context";

export const RootContexts: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <AlertContextProvider>
      <QueryContext>
        <CoreContextProvider>
          <FormsContextProvider>
            <TrainingContextProvider>{children}</TrainingContextProvider>
          </FormsContextProvider>
        </CoreContextProvider>
      </QueryContext>
    </AlertContextProvider>
  );
};
