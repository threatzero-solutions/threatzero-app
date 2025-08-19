import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import dayjs from "dayjs";
import {
  ChangeEvent,
  DetailedHTMLProps,
  ForwardedRef,
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useMemo,
} from "react";
import { Control, Controller } from "react-hook-form";
import { Field, FieldType, InternalFieldType } from "../../../types/entities";
import FileUploadInput from "./file-upload-input/FileUploadInput";
import Input from "./Input";
import RadioOptions, { RadioTypeOptions } from "./RadioOptions";
import Select from "./Select";
import TextArea from "./TextArea";

export interface SelectTypeOptions {
  options: { [key: string]: string };
}

export type FieldOnChangeEventType = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

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

export type FormInputProps<A = Record<string, unknown>> = A & {
  field?: Partial<Field>;
  mediaUploadUrl?: string;
  extraAttributes?: A;
  loadedValue?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const FormInput = forwardRef(
  <A extends Record<string, unknown> = Record<string, unknown>>(
    {
      field = {},
      extraAttributes,
      mediaUploadUrl = "",
      loadedValue,
      control,
      ...inputAttrs
    }: FormInputProps<A>,
    ref: ForwardedRef<unknown>
  ) => {
    const attrs: FormInputAttributes = useMemo(
      () => ({
        id: field.id,
        "data-fieldid": field.id,
        "data-fieldtype": field.type,
        name: field.name,
        type: field.type,
        placeholder: field.placeholder ?? undefined,
        ...extraAttributes,
        ...inputAttrs,
        ...field.elementProperties,
        ref: ref,
      }),
      [inputAttrs, extraAttributes, field, ref]
    );

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
        attrs.checked = !!attrs?.value;
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
              params={{ mediaUploadUrl }}
              loadedValue={loadedValue}
            />
          );
        case FieldType.SELECT: {
          const selectParams = field.typeParams as
            | SelectTypeOptions
            | undefined;
          return (
            <Select
              options={Object.entries(selectParams?.options ?? {}).map(
                ([key, label]) => ({ key, label })
              )}
              {...attrs}
            />
          );
        }
        case FieldType.RADIO: {
          const radioParams = field.typeParams as RadioTypeOptions | undefined;
          return (
            <RadioOptions
              options={radioParams?.options ?? {}}
              orientation={radioParams?.orientation}
              {...attrs}
            />
          );
        }
        case InternalFieldType.HTML:
        case InternalFieldType.JSON:
          return (
            <div className="rounded-md border-0 text-gray-900 shadow-xs ring-1 ring-gray-300 overflow-hidden">
              {control ? (
                <Controller
                  name={attrs.name ?? ""}
                  control={control}
                  render={({ field }) => (
                    <CodeMirror
                      extensions={[
                        attrs.type === InternalFieldType.JSON ? json() : html(),
                      ]}
                      {...attrs}
                      value={field.value}
                      editable={!attrs.disabled}
                      readOnly={attrs.readOnly}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
              ) : (
                <CodeMirror
                  extensions={[
                    attrs.type === InternalFieldType.JSON ? json() : html(),
                  ]}
                  {...attrs}
                  editable={!attrs.disabled}
                  readOnly={attrs.readOnly}
                />
              )}
            </div>
          );
        case FieldType.NONE:
          return <></>;
        case FieldType.CHECKBOX:
          return (
            <input
              className="h-4 w-4 rounded-sm border-gray-300 text-secondary-600 focus:ring-secondary-600"
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
          return <Input className="w-full" {...attrs} />;
      }
    }, [attrs, field.typeParams, loadedValue, mediaUploadUrl, control]);

    return <>{input}</>;
  }
);

export default FormInput;
