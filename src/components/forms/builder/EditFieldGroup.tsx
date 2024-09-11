import {
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormsContext } from "../../../contexts/forms/forms-context";
import {
  Field,
  FieldGroup,
  FieldType,
  InternalFieldType,
} from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFieldGroup, saveFieldGroup } from "../../../queries/forms";
import { produce } from "immer";
import FormInput, { FieldOnChangeEventType } from "../inputs/FormInput";
import SlideOverForm from "../../layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../layouts/slide-over/SlideOverField";

const INPUT_DATA: Array<Partial<Field> & { name: keyof FieldGroup }> = [
  {
    name: "title",
    label: "Title",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 1,
  },
  {
    name: "subtitle",
    label: "Subtitle",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 2,
  },
  {
    name: "description",
    label: "Description",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "8rem",
    },
    required: false,
    order: 3,
  },
  {
    name: "order",
    label: "Order",
    helpText: "",
    type: FieldType.NUMBER,
    required: false,
    order: 4,
  },
];

const EditFieldGroup: React.FC = () => {
  const [group, setGroup] = useState<Partial<FieldGroup>>({
    title: "",
    subtitle: "",
    description: "",
    order: undefined,
  });
  const groupDataLoaded = useRef(false);

  const { state: formsState, dispatch: formsDispatch } =
    useContext(FormsContext);

  const setOpen = (open: boolean) =>
    formsDispatch({ type: "SET_EDIT_FIELD_GROUP_SLIDER_OPEN", payload: open });

  const isNew = useMemo(
    () => formsState.activeFieldGroup?.id === undefined,
    [formsState.activeFieldGroup]
  );

  useEffect(() => {
    if (groupDataLoaded.current) {
      return;
    }

    const autoOrder = (
      formsState.activeFieldGroup?.parentGroup?.childGroups ??
      formsState.activeFieldGroup?.form?.groups ??
      []
    ).length;

    setGroup(
      produce((g) => {
        if (formsState.activeFieldGroup) {
          Object.assign(g, formsState.activeFieldGroup);
        }

        if (!Number.isInteger(g.order)) {
          g.order = autoOrder;
        }

        groupDataLoaded.current = true;
      })
    );
  }, [formsState.activeFieldGroup]);

  const handleChange = (
    input: { name: string },
    event: FieldOnChangeEventType
  ) => {
    const newValue = typeof event === "string" ? event : event.target.value;

    setGroup((g) => ({
      ...g,
      [input.name]: newValue,
    }));
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
  const fieldGroupMutation = useMutation({
    mutationFn: saveFieldGroup,
    onSuccess: () => {
      onMutateSuccess();
    },
  });
  const deleteFieldGroupMutation = useMutation({
    mutationFn: deleteFieldGroup,
    onSuccess: () => {
      onMutateSuccess();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!group) return;

    const newGroup = {
      ...group,
      parentGroup: group.parentGroup && {
        ...group.parentGroup,
        childGroups: undefined,
      },
      form: group.form && {
        ...group.form,
        groups: undefined,
      },
    } as unknown as FieldGroup;

    fieldGroupMutation.mutate(newGroup);
  };

  const handleDelete = () => {
    deleteFieldGroupMutation.mutate(group.id);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={fieldGroupMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add new field group" : "Edit field group"}
        description={
          "Edit the title, subtitle, or description for a field group"
        }
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            <FormInput
              field={input}
              onChange={(e: FieldOnChangeEventType) => handleChange(input, e)}
              value={group[input.name as keyof FieldGroup] ?? ""}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditFieldGroup;
