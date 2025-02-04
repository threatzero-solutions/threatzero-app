import { forwardRef } from "react";
import { classNames } from "../../../utils/core";
import {
  Textarea as HLTextarea,
  TextareaProps as HLTextareaProps,
} from "@headlessui/react";

const TextArea = forwardRef<HTMLTextAreaElement, HLTextareaProps>(
  ({ className, ...attrs }, ref) => {
    return (
      <HLTextarea
        ref={ref}
        {...attrs}
        className={(b) =>
          classNames(
            "block rounded-md border-0 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6 disabled:text-gray-500",
            typeof className === "function" ? className(b) : className
          )
        }
      />
    );
  }
);

export default TextArea;
