import { createContext, PropsWithChildren, useState } from "react";
import { Updater, useImmer } from "use-immer";
import ConfirmationModal, {
  ConfirmationModalProps,
} from "../../components/layouts/modal/ConfirmationModal";

export interface ConfirmationContextType {
  setOpen: (
    confirmationOptions: Omit<ConfirmationModalProps, "open" | "setOpen">
  ) => void;
  setClose: () => void;
  setConfirmationOptions: Updater<
    Omit<ConfirmationModalProps, "open" | "setOpen">
  >;
}

export const ConfirmationContext = createContext<ConfirmationContextType>({
  setOpen: () => {},
  setClose: () => {},
  setConfirmationOptions: () => {},
});

export const ConfirmationContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [confirmationOptions, setConfirmationOptions] = useImmer<
    Omit<ConfirmationModalProps, "open" | "setOpen">
  >({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleOpen = (
    options: Omit<ConfirmationModalProps, "open" | "setOpen">
  ) => {
    setConfirmationOptions(options);
    setOpen(true);
  };

  return (
    <ConfirmationContext.Provider
      value={{
        setOpen: handleOpen,
        setClose: () => setOpen(false),
        setConfirmationOptions,
      }}
    >
      {children}
      <ConfirmationModal
        {...confirmationOptions}
        open={open}
        setOpen={setOpen}
      />
    </ConfirmationContext.Provider>
  );
};
