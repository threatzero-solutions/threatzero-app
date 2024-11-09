import { forwardRef } from "react";
import { classNames } from "../../../utils/core";
import {
  Input as HLInput,
  InputProps as HLInputProps,
} from "@headlessui/react";

const Input = forwardRef<HTMLInputElement, HLInputProps>(
  ({ className, ...attrs }, ref) => {
    return (
      <HLInput
        {...attrs}
        ref={ref}
        className={(b) =>
          classNames(
            "block py-1.5 rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6 disabled:text-gray-500",
            typeof className === "function" ? className(b) : className
          )
        }
      />
    );
  }
);

export default Input;
