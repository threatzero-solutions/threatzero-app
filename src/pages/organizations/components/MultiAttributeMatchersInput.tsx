import {
  ArrowRightIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import React, { ReactNode, useContext } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
  UseFormRegister,
} from "react-hook-form";
import Input from "../../../components/forms/inputs/Input";
import Select from "../../../components/forms/inputs/Select";
import InformationButton from "../../../components/layouts/buttons/InformationButton";
import DataTable from "../../../components/layouts/tables/DataTable";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import {
  OrganizationIdpDto,
  SyncAttributeToAttributeDto,
} from "../../../types/api";
import { KeysOfType } from "../../../types/core";

type TName = KeysOfType<OrganizationIdpDto, SyncAttributeToAttributeDto[]>;

interface MultiAttributeMatchersInputProps {
  name: TName;
  renderValueInput: (props: {
    name:
      | `${TName}.${number}.patterns.${number}.value`
      | `${TName}.${number}.defaultValue`;
    register: UseFormRegister<OrganizationIdpDto>;
    index: number;
    control: Control<OrganizationIdpDto>;
  }) => ReactNode;
  valueLabel?: string;
}

const NEW_PATTERN = {
  pattern: "",
  value: "",
};

const MultiAttributeMatcherInput: React.FC<
  MultiAttributeMatchersInputProps & { index: number; onRemove: () => void }
> = ({ name, index, onRemove, renderValueInput, valueLabel = "Value" }) => {
  const { control, register, watch, getFieldState } =
    useFormContext<OrganizationIdpDto>();
  const {
    fields,
    append: appendPattern,
    remove: removePattern,
  } = useFieldArray({
    control,
    name: `${name}.${index}.patterns`,
  });

  const externalName = watch(`${name}.${index}.externalName`);
  const theseValues = watch(`${name}.${index}`);

  const { setOpen: setConfirmationOpen, setClose: setConfirmationClose } =
    useContext(ConfirmationContext);

  const handleRemoveSelf = () => {
    const fieldState = getFieldState(`${name}.${index}`);
    const shouldPrompt =
      fieldState.isDirty &&
      (theseValues.patterns.length > 0 ||
        theseValues.defaultValue ||
        theseValues.externalName);

    if (shouldPrompt) {
      setConfirmationOpen({
        title: `Remove ${valueLabel} Matcher?`,
        message: (
          <span>
            Are you sure you want to remove this matcher
            {externalName && (
              <strong> for external name "{externalName}"</strong>
            )}
            ? If you proceed, changes will be lost.
          </span>
        ),
        onConfirm: () => {
          onRemove();
          setConfirmationClose();
        },
        destructive: true,
        confirmText: "Remove",
      });
    } else {
      onRemove();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md ring-1 ring-inset ring-gray-200 p-4 relative">
      <button
        type="button"
        onClick={() => handleRemoveSelf()}
        className="absolute top-2 -left-7 text-red-600 hover:text-red-500 transition-colors"
      >
        <MinusCircleIcon className="size-5" />
      </button>
      <table className="border-separate border-spacing-1">
        <tbody>
          <tr>
            <td>
              <label
                htmlFor={`${name}.externalName`}
                className="text-xs font-semibold text-gray-900 inline-flex items-center gap-1"
              >
                Attribute Name
                <InformationButton text="Name of the attribute from the external identity provider to match against." />
              </label>
            </td>
            <td>
              <Input
                className="w-full"
                {...register(`${name}.${index}.externalName`)}
                required
              />
            </td>
          </tr>
          <tr>
            <td>
              <label
                htmlFor={`${name}.patternType`}
                className="text-xs font-semibold text-gray-900 inline-flex items-center gap-1"
              >
                Pattern Type
                <InformationButton text="Select which pattern type to use to match the external attribute value." />
              </label>
            </td>
            <td>
              <Controller
                name={`${name}.${index}.patternType`}
                control={control}
                render={({ field: patternTypeField }) => (
                  <Select
                    className="w-full"
                    value={patternTypeField.value}
                    onChange={(e) => patternTypeField.onChange(e.target.value)}
                    options={[
                      { key: "exact", label: "Exact" },
                      { key: "regex", label: "RegEx" },
                      { key: "glob", label: "Glob" },
                    ]}
                  />
                )}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label
                htmlFor={`${name}.${index}.defaultValue`}
                className="text-xs font-semibold text-gray-900 inline-flex items-center gap-1"
              >
                Default Value
                <InformationButton text="(Optional) The fallback value to use if no patterns match." />
              </label>
            </td>
            <td>
              {renderValueInput({
                name: `${name}.${index}.defaultValue`,
                control,
                index,
                register,
              })}
            </td>
          </tr>
        </tbody>
      </table>
      <Input
        type="hidden"
        {...register(`${name}.${index}.internalName`)}
        defaultValue="noop"
      />
      <DataTable
        dense
        data={{
          headers: [
            {
              label: "",
              key: "matchesSeparator",
              noSort: true,
            },
            {
              label: "Pattern",
              key: "pattern",
            },
            {
              label: "",
              key: "arrowSeparator",
              noSort: true,
            },
            {
              label: valueLabel,
              key: "value",
            },
            {
              label: (
                <span className="sr-only">Delete {valueLabel} Matcher</span>
              ),
              key: "delete",
              align: "right",
              noSort: true,
            },
          ],
          rows: fields.map((field, idx) => ({
            id: field.id,
            matchesSeparator: <PuzzlePieceIcon className="w-4 h-4" />,
            pattern: (
              <Input
                className="w-full"
                {...register(`${name}.${index}.patterns.${idx}.pattern`)}
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            value: renderValueInput({
              name: `${name}.${index}.patterns.${idx}.value`,
              control,
              index,
              register,
            }),
            delete: (
              <button type="button" onClick={() => removePattern(idx)}>
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          })),
        }}
        notFoundDetail="No patterns set."
      />
      <button
        type="button"
        className="self-stretch text-xs bg-gray-200 hover:bg-gray-300 rounded-md py-1 px-2 transition-colors inline-flex items-center gap-1"
        onClick={() => appendPattern(NEW_PATTERN)}
      >
        <PlusCircleIcon className="size-5 inline" />
        Add Pattern
      </button>
    </div>
  );
};

const NEW_MATCHER: SyncAttributeToAttributeDto = {
  externalName: "",
  internalName: "noop",
  patterns: [],
  patternType: "exact",
};

const MultiAttributeMatchersInput: React.FC<
  MultiAttributeMatchersInputProps
> = ({ name, valueLabel, ...props }) => {
  const { control } = useFormContext<OrganizationIdpDto>();
  const { fields, prepend, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="flex flex-col gap-2 py-2">
      <button
        type="button"
        className="self-stretch -ml-9 text-xs text-secondary-600 hover:text-secondary-700 rounded-md py-1 px-2 transition-colors inline-flex items-center gap-2"
        onClick={() => prepend(NEW_MATCHER)}
      >
        <PlusCircleIcon className="size-5 inline" />
        Add {valueLabel} Matcher
      </button>
      {fields.map((field, idx) => (
        <MultiAttributeMatcherInput
          key={field.id}
          name={name}
          index={idx}
          onRemove={() => remove(idx)}
          valueLabel={valueLabel}
          {...props}
        />
      ))}
    </div>
  );
};

export default MultiAttributeMatchersInput;
