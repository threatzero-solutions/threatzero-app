import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react/jsx-runtime";
import { classNames } from "../../../utils/core";

const InformationButton: React.FC<{ text: string }> = ({ text }) => {
  return (
    <Popover as={Fragment}>
      {({ open }) => (
        <>
          <PopoverButton className="inline">
            <InformationCircleIcon
              aria-hidden="true"
              className={classNames(
                "size-4 transition-colors",
                open ? "text-gray-400" : "text-gray-500"
              )}
            />
          </PopoverButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel
                className="bg-gray-600 text-white shadow-sm sm:rounded-lg [--anchor-gap:4px]"
                anchor="bottom start"
                static
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="py-2 px-3">
                  <p
                    className="text-xs max-w-64"
                    dangerouslySetInnerHTML={{ __html: text }}
                  />
                </div>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};

export default InformationButton;
