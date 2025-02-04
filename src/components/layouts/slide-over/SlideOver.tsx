import { Dialog, DialogPanel } from "@headlessui/react";
import { AnimatePresence, motion, Transition } from "motion/react";
import React, { PropsWithChildren } from "react";

interface SlideOverProps extends PropsWithChildren {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const transition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const SlideOver: React.FC<SlideOverProps> = ({ open, setOpen, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <Dialog className="relative z-30" static open={open} onClose={setOpen}>
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
          /> */}
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <DialogPanel
                  as={motion.div}
                  initial={{ x: "100%" }}
                  animate={{ x: "0%", transition }}
                  exit={{ x: "100%" }}
                  className="pointer-events-auto w-screen max-w-3xl overflow-y-scroll bg-white shadow-xl h-full"
                >
                  {children}
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SlideOver;
