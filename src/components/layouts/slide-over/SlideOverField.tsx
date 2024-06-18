import { PropsWithChildren } from "react";

interface SlideOverFieldProps extends PropsWithChildren {
  label: React.ReactNode;
  name?: string;
  helpText?: string | null;
}

const SlideOverField: React.FC<SlideOverFieldProps> = ({
  label,
  name,
  helpText,
  children,
}) => {
  return (
    <div className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
      <div>
        <label
          htmlFor={name}
          className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
        >
          {label}
        </label>
      </div>
      <div className="sm:col-span-2 space-y-2">
        {children}
        {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
      </div>
    </div>
  );
};

export default SlideOverField;
