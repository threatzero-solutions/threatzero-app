import FormInput, { FormInputProps } from "./inputs/FormInput";
import { classNames } from "../../utils/core";
import { forwardRef } from "react";

export interface FormFieldProps extends FormInputProps {
  onEdit?: () => void;
  fillColumns?: boolean;
}

const FormField: React.FC<FormFieldProps> = forwardRef(
  ({ field, onEdit, fillColumns = true, ...fieldAttrs }, ref) => {
    return (
      <div className={classNames(fillColumns ? "col-span-full" : "")}>
        <label
          htmlFor={field.name}
          className="block text-sm font-medium leading-6 text-gray-900"
          dangerouslySetInnerHTML={{ __html: field.label ?? "" }}
        />
        <div className="mt-2">
          <FormInput ref={ref} field={field} {...fieldAttrs} />
        </div>
        {field.helpText && (
          <p
            className="mt-3 text-sm leading-6 text-gray-600"
            dangerouslySetInnerHTML={{ __html: field.helpText }}
          />
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
