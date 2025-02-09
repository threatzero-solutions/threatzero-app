import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { PropsWithChildren } from "react";

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  setOpen: (open: boolean) => void;
  unmount?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  setOpen,
  unmount = true,
  children,
}) => {
  return (
    <Dialog
      open={open}
      onClose={setOpen}
      className="relative z-50"
      unmount={unmount}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in"
      />

      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:data-closed:translate-y-0 sm:data-closed:scale-95"
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
