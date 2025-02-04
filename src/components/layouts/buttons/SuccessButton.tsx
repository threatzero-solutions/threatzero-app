import { CheckIcon } from "@heroicons/react/20/solid";
import { PropsWithChildren } from "react";
import { classNames } from "../../../utils/core";

interface SuccessButtonProps {
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  buttonType?: "submit" | "button";
}

const SuccessButton: React.FC<PropsWithChildren<SuccessButtonProps>> = ({
  children,
  isLoading,
  isSuccess,
  disabled,
  buttonType,
}) => {
  return (
    <div className="flex justify-end items-center">
      <CheckIcon
        className={classNames(
          "h-5 w-5 text-green-400 mr-1 opacity-0 transition-opacity",
          isSuccess ? "opacity-100" : ""
        )}
      />
      <button
        type={buttonType ?? "submit"}
        disabled={disabled}
        className={classNames(
          "block w-min rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-500/50",
          isLoading ? "pointer-events-none bg-secondary-400 animate-pulse" : ""
        )}
      >
        {children}
      </button>
    </div>
  );
};

export default SuccessButton;
