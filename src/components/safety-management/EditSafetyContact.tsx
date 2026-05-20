import { ChangeEvent, FormEvent, useState } from "react";
import { Field, FieldType, SafetyContact } from "../../types/entities";
import { formatPhoneNumber, orderSort } from "../../utils/core";
import FormInput from "../forms/inputs/FormInput";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";
import SlideOverField from "../layouts/slide-over/SlideOverField";
import SlideOverFormBody from "../layouts/slide-over/SlideOverFormBody";
import SlideOverForm from "../layouts/slide-over/SlideOverForm";

type ContactFields = Pick<SafetyContact, "name" | "email" | "phone" | "title">;

const INPUT_DATA: Array<Partial<Field> & { name: keyof ContactFields }> = [
  {
    name: "name",
    label: "Name",
    helpText: "The name of the safety contact.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
  {
    name: "email",
    label: "Email",
    helpText: "The email address of the safety contact.",
    type: FieldType.EMAIL,
    required: true,
    order: 2,
  },
  {
    name: "phone",
    label: "Phone",
    helpText: "The phone number of the safety contact.",
    type: FieldType.TEL,
    required: true,
    order: 3,
  },
  {
    name: "title",
    label: "Title (Optional)",
    helpText: "The job or reference title of the safety contact.",
    type: FieldType.TEXT,
    required: false,
    order: 4,
  },
];

interface EditSafetyContactProps {
  safetyContact?: Partial<SafetyContact> | null;
  onSave: (values: ContactFields) => void;
  onDelete?: () => void;
  setOpen: (open: boolean) => void;
  saving?: boolean;
}

const EditSafetyContact: React.FC<EditSafetyContactProps> = ({
  safetyContact,
  onSave,
  onDelete,
  setOpen,
  saving,
}) => {
  const [draft, setDraft] = useState<Partial<ContactFields>>({
    name: safetyContact?.name ?? "",
    email: safetyContact?.email ?? "",
    phone: safetyContact?.phone ?? "",
    title: safetyContact?.title ?? "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft((v) => {
      const name = e.target.name as keyof ContactFields;
      let newValue = e.target.value;
      if (name === "phone") {
        newValue = formatPhoneNumber(newValue);
      }
      return { ...v, [name]: newValue };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSave({
      name: (draft.name ?? "").trim(),
      email: (draft.email ?? "").trim(),
      phone: (draft.phone ?? "").trim(),
      title: draft.title?.trim() || null,
    });
  };

  const isEditing = !!safetyContact?.id;

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      onDelete={isEditing && onDelete ? onDelete : undefined}
      deleteText="Remove"
      submitText={saving ? "Saving…" : "Save"}
    >
      <SlideOverHeading
        title={isEditing ? "Edit safety contact" : "Add safety contact"}
        description="Enter the details of this safety contact."
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
              onChange={handleChange}
              value={draft[input.name as keyof ContactFields] ?? ""}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditSafetyContact;
