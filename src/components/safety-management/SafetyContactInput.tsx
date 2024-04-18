import { useState } from "react";
import { SimpleChangeEvent } from "../../types/core";
import { SafetyContact } from "../../types/entities";
import TextArea from "../forms/inputs/TextArea";
import SlideOver from "../layouts/slide-over/SlideOver";
import EditSafetyContact from "./EditSafetyContact";

interface SafetyContactInputProps {
  value?: Partial<SafetyContact>;
  onChange?: (event: SimpleChangeEvent<Partial<SafetyContact>>) => void;
  name?: string;
}

const SafetyContactInput: React.FC<SafetyContactInputProps> = ({
  value,
  onChange,
  name,
}) => {
  const [editSafetyContactSliderOpen, setEditSafetyContactSliderOpen] =
    useState(false);

  const displayValue =
    value &&
    `${value.name}${value.title ? ` - ${value.title}` : ""}\n${value.email}\n${
      value.phone
    }`;

  const handleChange = (updatedValue: Partial<SafetyContact>) => {
    onChange?.({
      target: {
        name: name ?? "safetyContact",
        value: updatedValue,
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <TextArea value={displayValue ?? ""} readOnly rows={3} />
        <button
          type="button"
          onClick={() => setEditSafetyContactSliderOpen(true)}
          className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {value ? "Edit " : "Add "}Safety Contact
        </button>
      </div>
      <SlideOver
        open={editSafetyContactSliderOpen}
        setOpen={setEditSafetyContactSliderOpen}
      >
        <EditSafetyContact
          safetyContact={value}
          setSafetyContact={handleChange}
          setOpen={setEditSafetyContactSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default SafetyContactInput;
