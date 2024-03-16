import dayjs from "dayjs";
import {
	ChangeEvent,
	DetailedHTMLProps,
	InputHTMLAttributes,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
	useMemo,
} from "react";
import { Field, FieldType, InternalFieldType } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import Select from "./Select";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import FileUploadInput from "./file-upload-input/FileUploadInput";
import Input from "./Input";
import TextArea from "./TextArea";

export interface SelectTypeOptions {
	options: { [key: string]: string };
}

export interface RadioTypeOptions {
	options: { [key: string]: string };
	orientation?: "horizontal" | "vertical";
}

export type FieldOnChangeEventType =
	| ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	| string;

export type InputAttributes = DetailedHTMLProps<
	InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement
>;

export type TextareaAttributes = DetailedHTMLProps<
	TextareaHTMLAttributes<HTMLTextAreaElement>,
	HTMLTextAreaElement
>;

export type SelectAttributes = DetailedHTMLProps<
	SelectHTMLAttributes<HTMLSelectElement>,
	HTMLSelectElement
>;

type FormInputProps<A> = A & {
	field: Partial<Field>;
	mediaUploadUrl?: string;
	extraAttributes?: A;
	loadedValue?: unknown;
};

interface FormInputAttributes {
	id?: string;
	"data-fieldid"?: string;
	"data-fieldtype"?: string;
	name?: string;
	type?: string;
	placeholder?: string;
	required?: boolean;
	className?: string;
	style?: object;
	// biome-ignore lint/suspicious/noExplicitAny:
	value?: any;
	checked?: boolean;
	label?: string;
	disabled?: boolean;
	readOnly?: boolean;
}

const FormInput = <
	A extends Record<string, unknown> = Record<string, unknown>,
>({
	field,
	extraAttributes,
	mediaUploadUrl,
	loadedValue,
	...inputAttrs
}: FormInputProps<A>) => {
	const attrs: FormInputAttributes = {
		id: field.id,
		"data-fieldid": field.id,
		"data-fieldtype": field.type,
		name: field.name,
		type: field.type,
		placeholder: field.placeholder ?? undefined,
		...extraAttributes,
		...inputAttrs,
		...field.elementProperties,
	};

	if (field.required) {
		attrs.required = true;
	}

	if (attrs.style !== undefined) {
		if (typeof attrs.style !== "object") {
			Reflect.deleteProperty(attrs, "style");
		}
	}

	if (Object.hasOwn(attrs, "value") && attrs.value !== undefined) {
		if (attrs.type === FieldType.CHECKBOX) {
			attrs.checked = !!attrs?.value ?? false;
			Reflect.deleteProperty(attrs, "value");
		} else if (attrs.type === FieldType.DATE) {
			attrs.value = dayjs(attrs.value as string).format("YYYY-MM-DD");
		} else {
			attrs.value = attrs.value ?? "";
		}
	}

	const input = useMemo(() => {
		if (attrs.type === FieldType.TEXTAREA) {
			return <TextArea className="py-1.5 w-full" {...attrs} />;
		}

		switch (attrs.type) {
			case "file":
				return (
					<FileUploadInput
						{...attrs}
						params={{ mediaUploadUrl: mediaUploadUrl ?? "" }}
						loadedValue={loadedValue}
					/>
				);
			case FieldType.SELECT: {
				const selectParams = field.typeParams as SelectTypeOptions | undefined;
				return <Select options={selectParams?.options ?? {}} {...attrs} />;
			}
			case FieldType.RADIO: {
				const radioParams = field.typeParams as RadioTypeOptions | undefined;
				return (
					<fieldset className={classNames(attrs.className)}>
						<legend className="sr-only">{`${attrs.label}`}</legend>
						<div
							className={classNames(
								"flex flex-col",
								radioParams?.orientation === "horizontal"
									? "gap-y-4 sm:flex-row sm:items-center sm:gap-x-10 sm:flex-wrap"
									: "gap-y-4",
							)}
						>
							{Object.entries(radioParams?.options ?? {}).map(
								([value, label]) => (
									<div key={value} className="flex items-center">
										<input
											{...attrs}
											id={`${attrs.id}_${value}`}
											className="h-4 w-4 border-gray-300 text-secondary-600 focus:ring-secondary-600"
											type="radio"
											value={value}
											checked={attrs.value === value}
											name={attrs.name}
										/>
										<label
											htmlFor={`${attrs.id}_${value}`}
											className="ml-3 block text-sm font-medium leading-6 text-gray-900"
										>
											{label}
										</label>
									</div>
								),
							)}
						</div>
					</fieldset>
				);
			}
			case InternalFieldType.HTML:
			case InternalFieldType.JSON:
				return (
					<CodeMirror
						extensions={[
							attrs.type === InternalFieldType.JSON ? json() : html(),
						]}
						{...(attrs as object)}
						editable={!attrs.disabled}
						readOnly={attrs.readOnly}
					/>
				);
			case FieldType.NONE:
				return <></>;
			case FieldType.CHECKBOX:
				return (
					<input
						className="h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
						{...({
							...attrs,
							...(attrs.readOnly ? { disabled: true } : {}),
						} as DetailedHTMLProps<
							InputHTMLAttributes<HTMLInputElement>,
							HTMLInputElement
						>)}
					/>
				);
			default:
				return <Input className="w-full py-1.5" {...attrs} />;
		}
	}, [attrs, field.typeParams, loadedValue, mediaUploadUrl]);

	return <>{input}</>;
};

export default FormInput;
