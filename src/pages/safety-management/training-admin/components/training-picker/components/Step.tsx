import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/20/solid";
import type { PropsWithChildren, ReactNode } from "react";
import IconButton from "../../../../../../components/layouts/buttons/IconButton";
import { cn } from "../../../../../../utils/core";

export default function Step({
  className,
  title,
  subtitle,
  onContinue,
  continueDisabled,
  continueButtonText,
  onStepBackward,
  children,
  footerSlotEnd: footerSlotRight,
  footerSlotStart: footerSlotLeft,
}: PropsWithChildren<{
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueButtonText?: string;
  onStepBackward?: () => void;
  footerSlotEnd?: ReactNode;
  footerSlotStart?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "w-full max-w-xl flex flex-col items-stretch justify-center gap-4",
        className
      )}
    >
      <div>
        {title && <h3 className="text-center text-lg font-bold">{title}</h3>}
        {subtitle && (
          <h4 className="text-center text-sm text-muted-foreground">
            {subtitle}
          </h4>
        )}
      </div>
      {children}
      <div className="flex gap-4">
        {onStepBackward && (
          <IconButton
            onClick={onStepBackward}
            icon={ArrowLeftIcon}
            text="Back"
          />
        )}
        {footerSlotLeft}
        <div className="flex-1" />
        {footerSlotRight}
        {onContinue && (
          <IconButton
            onClick={onContinue}
            disabled={continueDisabled}
            icon={ArrowRightIcon}
            text={continueButtonText ?? "Continue"}
          />
        )}
      </div>
    </div>
  );
}
