import { PropsWithChildren } from "react";
import { AlertContextProvider } from "./alert/alert-context";
import { ConfirmationContextProvider } from "./core/confirmation-context";
import { CoreContextProvider } from "./core/core-context";
import { FormsContextProvider } from "./forms/forms-context";
import { MeProvider } from "./me/MeProvider";
import { ResidencePickerProvider } from "./me/ResidencePickerProvider";
import QueryContext from "./QueryContext";
import { TrainingContextProvider } from "./training/training-context";

export const RootContexts: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <AlertContextProvider>
      <QueryContext>
        <MeProvider>
          <ResidencePickerProvider>
            <ConfirmationContextProvider>
              <CoreContextProvider>
                <FormsContextProvider>
                  <TrainingContextProvider>{children}</TrainingContextProvider>
                </FormsContextProvider>
              </CoreContextProvider>
            </ConfirmationContextProvider>
          </ResidencePickerProvider>
        </MeProvider>
      </QueryContext>
    </AlertContextProvider>
  );
};
