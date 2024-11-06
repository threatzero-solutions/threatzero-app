import {
  Checkbox as HLCheckbox,
  CheckboxProps as HLCheckboxProps,
} from "@headlessui/react";
import { forwardRef } from "react";
import { classNames } from "../../../utils/core";
import { CheckIcon } from "@heroicons/react/16/solid";

const Checkbox = forwardRef<HTMLInputElement, HLCheckboxProps>(
  ({ className, ...attrs }, ref) => {
    return (
      <HLCheckbox
        ref={ref}
        {...attrs}
        className={(b) =>
          classNames(
            "cursor-pointer transition-all",
            "hover:ring-2 hover:ring-secondary-600",
            "group size-6 block rounded-md p-1 ring-1 ring-inset ring-gray-300 shadow-sm bg-gray-50 data-[checked]:bg-secondary-600 data-[checked]:ring-secondary-600",
            typeof className === "function" ? className(b) : className
          )
        }
      >
        <CheckIcon className="hidden size-4 fill-white group-data-[checked]:block" />
      </HLCheckbox>
    );
  }
);

export default Checkbox;
