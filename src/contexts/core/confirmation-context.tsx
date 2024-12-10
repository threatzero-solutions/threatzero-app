import { createContext, PropsWithChildren, useState } from "react";
import { Updater, useImmer } from "use-immer";
import ConfirmationModal, {
  ConfirmationModalProps,
} from "../../components/layouts/modal/ConfirmationModal";

type TConfirmationOptions = Omit<ConfirmationModalProps, "open" | "setOpen">;

export interface ConfirmationContextType {
  setOpen: (confirmationOptions: TConfirmationOptions) => void;
  setClose: () => void;
  setConfirmationOptions: Updater<TConfirmationOptions>;
  openConfirmDiscard: (
    onConfirm: TConfirmationOptions["onConfirm"],
    options?: Omit<TConfirmationOptions, "onConfirm">
  ) => void;
}

export const ConfirmationContext = createContext<ConfirmationContextType>({
  setOpen: () => {},
  setClose: () => {},
  setConfirmationOptions: () => {},
  openConfirmDiscard: () => {},
});

export const ConfirmationContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [confirmationOptions, setConfirmationOptions] =
    useImmer<TConfirmationOptions>({
      title: "",
      message: "",
      onConfirm: () => {},
    });

  const handleOpen = (options: TConfirmationOptions) => {
    setConfirmationOptions(options);
    setOpen(true);
  };

  const openConfirmDiscard = (
    onConfirm: TConfirmationOptions["onConfirm"],
    options?: Omit<TConfirmationOptions, "onConfirm">
  ) => {
    handleOpen({
      title: "Discard changes?",
      message: "Are you sure you want to discard your changes?",
      onConfirm: () => {
        onConfirm();
        setOpen(false);
      },
      confirmText: "Discard",
      cancelText: "Go Back",
      ...options,
    });
  };

  return (
    <ConfirmationContext.Provider
      value={{
        setOpen: handleOpen,
        setClose: () => setOpen(false),
        setConfirmationOptions,
        openConfirmDiscard,
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
