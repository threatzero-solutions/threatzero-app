import { ChangeEvent, FormEvent, useState } from "react";
import { Field, FieldType, SafetyContact } from "../../types/entities";
import { formatPhoneNumber, orderSort } from "../../utils/core";
import FormInput from "../forms/inputs/FormInput";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";
import SlideOverField from "../layouts/slide-over/SlideOverField";
import SlideOverFormBody from "../layouts/slide-over/SlideOverFormBody";
import SlideOverForm from "../layouts/slide-over/SlideOverForm";

const INPUT_DATA: Array<Partial<Field> & { name: keyof SafetyContact }> = [
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
  safetyContact?: Partial<SafetyContact>;
  setSafetyContact: (safetyContact: Partial<SafetyContact> | null) => void;
  setOpen: (open: boolean) => void;
}

const EditSafetyContact: React.FC<EditSafetyContactProps> = ({
  safetyContact,
  setSafetyContact,
  setOpen,
}) => {
  const [tempSafetyContact, setTempSafetyContact] = useState<
    Partial<SafetyContact>
  >(safetyContact ?? {});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempSafetyContact((v) => {
      const name = e.target.name;
      let newValue = e.target.value;

      if (name === "phone") {
        newValue = formatPhoneNumber(newValue);
      }

      return {
        ...v,
        [name]: newValue,
      };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setSafetyContact(tempSafetyContact);
    setOpen(false);
  };

  const handleRemove = () => {
    setSafetyContact(null);
    setOpen(false);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      onDelete={() => handleRemove()}
      deleteText="Clear"
      submitText="Done"
    >
      <SlideOverHeading
        title={safetyContact ? "Add safety contact" : "Edit safety contact"}
        description="Enter the details of this organization's safety contact."
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
              value={tempSafetyContact[input.name as keyof SafetyContact] ?? ""}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditSafetyContact;
