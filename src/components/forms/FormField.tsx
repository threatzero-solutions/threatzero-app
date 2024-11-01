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

const FormField: React.FC<FormFieldProps> = forwardRef(
  (
    {
      field,
      onEdit,
      fillColumns = true,
      input,
      helpTextFirst = false,
      action,
      ...fieldAttrs
    },
    ref
  ) => {
    return (
      <div className={classNames(fillColumns ? "col-span-full" : "")}>
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
        <div className="mt-2">
          {input || <FormInput ref={ref} field={field} {...fieldAttrs} />}
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
