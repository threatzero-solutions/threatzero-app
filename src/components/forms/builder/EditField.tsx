import {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FormsContext } from "../../../contexts/forms/forms-context";
import {
  Field,
  FieldGroup,
  FieldType,
  Form,
  InternalFieldType,
} from "../../../types/entities";
import FormField from "../FormField";
import { noMutateSort, orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteField, saveField } from "../../../queries/forms";
import { produce } from "immer";
import FormInput, { FieldOnChangeEventType } from "../inputs/FormInput";
import { useImmer } from "use-immer";
import SlideOverForm from "../../layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../layouts/slide-over/SlideOverField";

type EditFieldFieldType = Partial<Field> & { name: keyof Field | "parent" };
const INPUT_DATA: EditFieldFieldType[] = [
  {
    name: "parent",
    label: "Parent",
    helpText: "",
    type: FieldType.SELECT,
    typeParams: {
      options: {},
    },
    required: true,
    order: 0,
  },
  {
    name: "label",
    label: "Label",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: true,
    order: 1,
  },
  {
    name: "placeholder",
    label: "Placeholder",
    helpText: "",
    type: FieldType.TEXTAREA,
    elementProperties: {
      rows: 3,
    },
    required: false,
    order: 2,
  },
  {
    name: "helpText",
    label: "Help Text",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 3,
  },
  {
    name: "type",
    label: "Type",
    helpText: "",
    type: FieldType.SELECT,
    typeParams: {
      options: Object.values(FieldType).reduce((acc, value) => {
        acc[value] = value;
        return acc;
      }, {} as Record<string, string>),
    },
    required: true,
    order: 4,
  },
  {
    name: "elementProperties",
    label: "Element Properties",
    helpText: `
      Key-value pairs of additional attributes to place on the input element. Must be valid JSON.
      <br/><br/>
      Example:
      <pre>{\n\trows: 3\n}</pre>
    `,
    type: InternalFieldType.JSON,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 5,
  },
  {
    name: "typeParams",
    label: "Type Parameters",
    helpText: `
      Options specfic to the type selected. Must be valid JSON.
      <br/><br/>
      <p>Parameters by type:</p>
      <ul style="margin-top: 0.6rem;">
        <li><i>${FieldType.SELECT}</i> <pre>{\n\t"options": {\n\t\t"someValue": "Some Label"\n\t}\n}</pre></li>
        <li><i>${FieldType.RADIO}</i> <pre>{\n\t"options": {\n\t\t"someValue": "Some Label"\n\t},\n\t"orientation": "vertical" | "horizontal"\n}</pre></li>
      </ul>
    `,
    type: InternalFieldType.JSON,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 6,
  },
  {
    name: "required",
    label: "Required",
    helpText: "",
    type: FieldType.CHECKBOX,
    required: false,
    order: 7,
  },
  {
    name: "order",
    label: "Order",
    helpText: "",
    type: FieldType.NUMBER,
    required: false,
    order: 8,
  },
];

const getNameFromLabel = (label: string, existingFieldNames: string[]) => {
  let name = label
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/gi, "")
    .toLowerCase()
    .slice(0, 120);

  let nameConflict = existingFieldNames?.includes(name);
  let i = 0;
  while (nameConflict) {
    name = `${name}-${i++}`;
    nameConflict = existingFieldNames?.includes(name);
  }

  return name;
};

const EditField: React.FC = () => {
  const [field, setField] = useImmer<Partial<Field>>({
    name: "",
    label: "",
    placeholder: "",
    helpText: "",
    type: FieldType.TEXT,
    required: false,
    order: undefined,
  });
  const [fieldDataLoaded, setFieldDataLoaded] = useState(false);

  const { state: formsState, dispatch: formsDispatch } =
    useContext(FormsContext);

  const setOpen = (open: boolean) =>
    formsDispatch({ type: "SET_EDIT_FIELD_SLIDER_OPEN", payload: open });

  const isNew = useMemo(
    () => formsState.activeField?.id === undefined,
    [formsState.activeField]
  );

  /** Flat maps all form fields, including those in groups. */
  const allFields = useMemo(() => {
    const _fields = [...(formsState.activeForm?.fields ?? [])];

    const _addFieldsFromGroups = (groups?: FieldGroup[]) => {
      if (groups) {
        for (const _g of groups) {
          _addFieldsFromGroups(_g.childGroups);
          _fields.push(...(_g.fields ?? []));
        }
      }
    };

    _addFieldsFromGroups(formsState.activeForm?.groups);

    return _fields;
  }, [formsState.activeForm]);

  const parents = useMemo(() => {
    const flatMap: {
      [key: string]: {
        parent: Partial<Form> | Partial<FieldGroup>;
        type: "form" | "group";
        stringRepresentation: string;
      };
    } = {};

    if (formsState.activeForm?.id) {
      flatMap[formsState.activeForm.id] = {
        parent: formsState.activeForm,
        type: "form",
        stringRepresentation: formsState.activeForm.title ?? "Unknown Form",
      };
    }

    const addGroups = (groups?: FieldGroup[], level = 1) => {
      if (groups) {
        for (const _g of noMutateSort(groups, orderSort) ?? []) {
          flatMap[_g.id] = {
            parent: _g,
            type: "group",
            stringRepresentation: `${"—".repeat(level)} ${
              _g.title ?? "Unknown Group"
            }`,
          };
          addGroups(_g.childGroups, level + 1);
        }
      }
    };

    addGroups(formsState.activeForm?.groups);

    return flatMap;
  }, [formsState.activeForm]);

  const parentOptions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(parents).map(([k, v]) => [k, v.stringRepresentation])
      ),
    [parents]
  );

  useEffect(() => {
    if (fieldDataLoaded) {
      return;
    }

    const autoOrder = (
      formsState.activeField?.group?.fields ??
      formsState.activeField?.form?.fields ??
      []
    ).length;

    setField(
      produce((f) => {
        if (formsState.activeField) {
          Object.assign(f, formsState.activeField);
        }

        if (!Number.isInteger(f.order)) {
          f.order = autoOrder;
        }

        setFieldDataLoaded(true);
      })
    );
  }, [formsState.activeField, fieldDataLoaded]);

  const handleChange = useCallback(
    (input: EditFieldFieldType, event: FieldOnChangeEventType) => {
      const existingFieldNames = allFields.map((f) => f.name);

      const newValue =
        typeof event === "string"
          ? event
          : event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

      setField((f) => {
        // @ts-ignore
        f[input.name] = newValue;

        // Automatically set name field based on label.
        if (Object.hasOwn(f, "label")) {
          f.name = getNameFromLabel(f.label ?? "", existingFieldNames);
        }
      });
    },
    [allFields]
  );

  const handleJsonFieldChange = (name: keyof Field, value: string) => {
    try {
      let props: object | null = null;
      if (value) {
        props = JSON.parse(value);
      }
      setField((f) => ({ ...f, [name]: props }));
    } catch (e) {
      console.error("Error updating JSON field value:", e);
    }
  };

  const handleParentChange = (event: FieldOnChangeEventType) => {
    const id = typeof event === "string" ? event : event.target.value;
    const parent = parents[id];

    if (parent.type === "form") {
      setField((f) => ({
        ...f,
        form: parent.parent as Form,
        group: undefined,
      }));
    } else {
      setField((f) => ({
        ...f,
        group: parent.parent as FieldGroup,
        form: undefined,
      }));
    }
  };

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [
        "form",
        formsState.activeForm?.slug,
        formsState.activeForm?.id,
      ],
    });
    setOpen(false);
  };
  const fieldMutation = useMutation({
    mutationFn: saveField,
    onSuccess: () => {
      onMutateSuccess();
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: deleteField,
    onSuccess: () => {
      onMutateSuccess();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newField = {
      ...field,
      form: field.form && {
        ...field.form,
        fields: undefined,
        groups: undefined,
      },
      group: field.group && {
        ...field.group,
        fields: undefined,
        childGroups: undefined,
      },
    } as unknown as Field;

    fieldMutation.mutate(newField);
  };

  const handleDelete = () => {
    deleteFieldMutation.mutate(field.id);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={fieldMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add new field" : "Edit field"}
        description={"Use the preview below to see the results"}
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
          <div className="overflow-hidden rounded-lg bg-gray-50">
            <div className="px-4 py-5 sm:p-6">
              <FormField
                field={{ ...field, name: "preview", required: undefined }}
                mediaUploadUrl=""
              />
            </div>
          </div>
        </div>
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            {input.name === "parent" ? (
              <FormInput
                field={{
                  ...input,
                  typeParams: {
                    options: parentOptions,
                  },
                }}
                onChange={handleParentChange}
                value={field.form?.id ?? field.group?.id ?? ""}
              />
            ) : input.type === InternalFieldType.JSON ? (
              <FormInput
                field={input}
                value={
                  JSON.stringify(
                    formsState.activeField?.[input.name as keyof Field] ??
                      undefined,
                    null,
                    2
                  ) ?? "{}"
                }
                onChange={(v: string) =>
                  handleJsonFieldChange(input.name as keyof Field, v)
                }
              />
            ) : (
              <FormInput
                field={input}
                value={field[input.name as keyof Field] ?? ""}
                onChange={(e: FieldOnChangeEventType) => handleChange(input, e)}
              />
            )}
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditField;
