import { Field } from "../../types/entities";
import { ChangeEvent } from "react";
import FormInput from "./inputs/FormInput";

export interface FormFieldProps {
	field: Partial<Field>;
	value?: any;
	onChange?: (event: Partial<ChangeEvent<any>>) => void;
	onEdit?: () => void;
	readOnly?: boolean;
	mediaUploadUrl: string;
	loadedValue?: any;
}

const FormField: React.FC<FormFieldProps> = ({
	field,
	value,
	onChange,
	onEdit,
	readOnly,
	mediaUploadUrl,
	loadedValue,
}) => {
	return (
		<div className="col-span-full">
			<label
				htmlFor={field.name}
				className="block text-sm font-medium leading-6 text-gray-900"
				dangerouslySetInnerHTML={{ __html: field.label ?? "" }}
			/>
			<div className="mt-2">
				<FormInput
					field={field}
					mediaUploadUrl={mediaUploadUrl}
					value={value}
					readOnly={readOnly}
					onChange={onChange}
					loadedValue={loadedValue}
				/>
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
};

export default FormField;
