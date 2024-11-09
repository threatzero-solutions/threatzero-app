import { useState } from "react";
import { SimpleChangeEvent } from "../../types/core";
import { SafetyContact } from "../../types/entities";
import SlideOver from "../layouts/slide-over/SlideOver";
import EditSafetyContact from "./EditSafetyContact";
import FormField from "../forms/FormField";
import SafetyContactBody from "./SafetyContactBody";
import Block from "../layouts/content/Block";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import IconButton from "../layouts/buttons/IconButton";

interface SafetyContactInputProps {
  value?: Partial<SafetyContact>;
  onChange?: (event: SimpleChangeEvent<Partial<SafetyContact> | null>) => void;
  name?: string;
  label?: string;
  helpText?: string;
}

const SafetyContactInput: React.FC<SafetyContactInputProps> = ({
  value,
  onChange,
  name,
  label = "Safety Contact",
  helpText,
}) => {
  const [editSafetyContactSliderOpen, setEditSafetyContactSliderOpen] =
    useState(false);

  const handleChange = (updatedValue: Partial<SafetyContact> | null) => {
    onChange?.({
      target: {
        name: name ?? "safetyContact",
        value: updatedValue,
      },
    });
  };

  return (
    <>
      <FormField
        field={{
          label,
          name,
          helpText,
        }}
        fillColumns={false}
        action={
          <IconButton
            icon={value ? PencilSquareIcon : PlusIcon}
            className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
            text={`${value ? "Edit " : "Add "}Safety Contact`}
            type="button"
            onClick={() => setEditSafetyContactSliderOpen(true)}
          />
        }
        input={
          <Block className="grid grid-col-1 bg-gray-50">
            {value && <SafetyContactBody value={value} />}
          </Block>
        }
      />
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
