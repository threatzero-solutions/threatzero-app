import {
  Switch as HLSwitch,
  SwitchProps as HLSwitchProps,
} from "@headlessui/react";
import { forwardRef } from "react";
import { cn } from "../../../utils/core";

const Toggle = forwardRef<
  HTMLButtonElement,
  HLSwitchProps & { loading?: boolean }
>(({ className, loading, ...attrs }, ref) => {
  return (
    <HLSwitch
      {...attrs}
      ref={ref}
      className={(b) =>
        cn(
          "group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-checked:bg-secondary-600 data-disabled:opacity-50",
          typeof className === "function" ? className(b) : className
        )
      }
    >
      <span
        className={cn(
          "size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6",
          loading &&
            "animate-spin border-2 border-gray-300 border-t-transparent"
        )}
      />
    </HLSwitch>
  );
});

export default Toggle;
