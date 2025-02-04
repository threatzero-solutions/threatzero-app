import React, { Fragment, PropsWithChildren } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";

interface SlideOverProps extends PropsWithChildren {
  open: boolean;
  setOpen: (open: boolean) => void;
  unmount?: boolean;
}

const SlideOver: React.FC<SlideOverProps> = ({
  open,
  setOpen,
  unmount,
  children,
}) => {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-30"
        onClose={setOpen}
        unmount={unmount}
      >
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <TransitionChild as={Fragment}>
                <DialogPanel className="pointer-events-auto w-screen max-w-3xl overflow-y-scroll bg-white shadow-xl h-full transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                  {children}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SlideOver;
