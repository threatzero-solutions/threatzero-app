import { FormEvent, useContext, useEffect, useState } from "react";
import { FormsContext } from "../../../contexts/forms/forms-context";
import { Field, Form, InternalFieldType } from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveForm } from "../../../queries/forms";
import { produce } from "immer";
import FormInput, { FieldOnChangeEventType } from "../inputs/FormInput";
import SlideOverField from "../../layouts/slide-over/SlideOverField";
import SlideOverForm from "../../layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../layouts/slide-over/SlideOverHeading";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Form }> = [
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
      height: "6rem",
    },
    required: false,
    order: 3,
  },
];

const EditFormMetadata: React.FC = () => {
  const [form, setForm] = useState<Partial<Form>>({
    title: "",
    subtitle: "",
    description: "",
  });

  const { state: formsState, dispatch: formsDispatch } =
    useContext(FormsContext);

  const setOpen = (open: boolean) =>
    formsDispatch({ type: "SET_METADATA_SLIDER_OPEN", payload: open });

  useEffect(() => {
    setForm(
      produce((f) => {
        if (formsState.activeForm) {
          Object.assign(f, formsState.activeForm);
        }
      })
    );
  }, [formsState.activeForm]);

  const handleChange = (
    input: { name: string },
    event: FieldOnChangeEventType
  ) => {
    const newValue = typeof event === "string" ? event : event.target.value;

    setForm((f) => ({
      ...f,
      [input.name]: newValue,
    }));
  };

  const queryClient = useQueryClient();
  const saveFormMutation = useMutation({
    mutationFn: saveForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["form", data.slug, data.id],
      });
      setOpen(false);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    saveFormMutation.mutate(form);
  };

  return (
    <SlideOverForm onSubmit={handleSubmit} onClose={() => setOpen(false)}>
      <SlideOverHeading
        title="Edit form metadata"
        description={"Metadata includes the title, subtitle, and description"}
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
              value={form[input.name] ?? ""}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditFormMetadata;
