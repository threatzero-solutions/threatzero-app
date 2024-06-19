import { ChangeEvent, FormEvent, useState } from "react";
import { Field, FieldType, SafetyContact } from "../../types/entities";
import { formatPhoneNumber, orderSort } from "../../utils/core";
import FormInput from "../forms/inputs/FormInput";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";

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
  setSafetyContact: (safetyContact: Partial<SafetyContact>) => void;
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

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        <SlideOverHeading
          title={safetyContact ? "Add safety contact" : "Edit safety contact"}
          description="Enter the details of this organization's safety contact."
          setOpen={setOpen}
        />

        {/* Divider container */}
        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          {INPUT_DATA.sort(orderSort).map((input) => (
            <div
              key={input.name}
              className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5"
            >
              <div>
                <label
                  htmlFor={input.name}
                  className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
                >
                  {input.label}
                </label>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <FormInput
                  field={input}
                  onChange={handleChange}
                  value={
                    tempSafetyContact[input.name as keyof SafetyContact] ?? ""
                  }
                />
                {input.helpText && (
                  <p className="text-sm text-gray-500">{input.helpText}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          <div className="grow" />
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            Done
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditSafetyContact;
