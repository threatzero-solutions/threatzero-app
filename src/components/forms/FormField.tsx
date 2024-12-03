import FormInput, { FormInputProps } from "./inputs/FormInput";
import { classNames } from "../../utils/core";
import { forwardRef, ReactNode } from "react";
import { Field } from "../../types/entities";

export interface FormFieldProps extends FormInputProps {
  onEdit?: () => void;
  fillColumns?: boolean;
  field: Partial<Field>;
  input?: ReactNode;
  helpTextFirst?: boolean;
  action?: ReactNode;
}

const HelpText: React.FC<{ helpText: string; className?: string }> = ({
  helpText,
  className,
}) => {
  return (
    <p
      className={classNames(className, "text-sm leading-6 text-gray-600")}
      dangerouslySetInnerHTML={{ __html: helpText }}
    />
  );
};

const FormField = forwardRef(
  (
    {
      field,
      onEdit,
      fillColumns = true,
      input,
      helpTextFirst = false,
      action,
      ...fieldAttrs
    }: FormFieldProps,
    ref
  ) => {
    return (
      <div
        className={classNames("space-y-2", fillColumns ? "col-span-full" : "")}
      >
        {(field.label || action || field.helpText) && (
          <div className="w-full flex items-center gap-1">
            <div className="grow">
              <label
                htmlFor={field.name}
                className="block text-sm font-medium leading-6 text-gray-900"
                dangerouslySetInnerHTML={{ __html: field.label ?? "" }}
              />
              {helpTextFirst && field.helpText && (
                <HelpText helpText={field.helpText} className="mb-3" />
              )}
            </div>
            {action}
          </div>
        )}
        <div>
          {input || <FormInput ref={ref} field={field} {...fieldAttrs} />}
          {field.validationError && (
            <span className="text-xs text-red-500 mt-1">
              {field.validationError}
            </span>
          )}
        </div>
        {!helpTextFirst && field.helpText && (
          <HelpText helpText={field.helpText} className="mt-3" />
        )}
        {onEdit && (
          <button
            type="button"
            className="text-secondary-600 hover:text-secondary-900"
            onClick={() => onEdit()}
          >
            Edit
          </button>
        )}
      </div>
    );
  }
);

export default FormField;
