import { PropsWithChildren } from "react";
import InformationButton from "../buttons/InformationButton";

interface SlideOverFieldProps extends PropsWithChildren {
  label: React.ReactNode;
  name?: string;
  helpText?: string | null;
  discreetHelpText?: boolean;
}

const SlideOverField: React.FC<SlideOverFieldProps> = ({
  label,
  name,
  helpText,
  discreetHelpText = false,
  children,
}) => {
  return (
    <div className="space-y-2 px-4 sm:grid sm:grid-cols-4 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
      <div>
        <label
          htmlFor={name}
          className="text-sm font-medium leading-6 text-gray-900 sm:mt-1.5 inline-flex items-center gap-1"
        >
          {label}
          {helpText && discreetHelpText && (
            <InformationButton text={helpText} />
          )}
        </label>
      </div>
      <div className="sm:col-span-3 space-y-2">
        {children}
        {helpText && !discreetHelpText && (
          <p
            className="text-sm text-gray-500"
            dangerouslySetInnerHTML={{ __html: helpText }}
          />
        )}
      </div>
    </div>
  );
};

export default SlideOverField;
