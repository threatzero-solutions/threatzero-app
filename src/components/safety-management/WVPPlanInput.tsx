import { useState } from "react";
import { SimpleChangeEvent } from "../../types/core";
import { WorkplaceViolencePreventionPlan } from "../../types/entities";
import SlideOver from "../layouts/slide-over/SlideOver";
import EditWVPPlan from "./EditWVPPlan";
import Input from "../forms/inputs/Input";

interface WVPPlanInputProps {
  value?: Partial<WorkplaceViolencePreventionPlan>;
  onChange?: (
    event: SimpleChangeEvent<Partial<WorkplaceViolencePreventionPlan>>
  ) => void;
  name?: string;
}

const WVPPlanInput: React.FC<WVPPlanInputProps> = ({
  value,
  onChange,
  name,
}) => {
  const [editWVPPlanSliderOpen, setEditWVPPlanSliderOpen] = useState(false);

  const handleChange = (
    updatedValue: Partial<WorkplaceViolencePreventionPlan>
  ) => {
    onChange?.({
      target: {
        name: name ?? "workplaceViolencePreventionPlan",
        value: updatedValue,
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Input value={value?.pdfS3Key ?? ""} readOnly />
        <button
          type="button"
          onClick={() => setEditWVPPlanSliderOpen(true)}
          className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {value ? "Edit " : "Add "}WVP Plan
        </button>
      </div>
      <SlideOver
        open={editWVPPlanSliderOpen}
        setOpen={setEditWVPPlanSliderOpen}
      >
        <EditWVPPlan
          wvpPlan={value}
          setWvpPlan={handleChange}
          setOpen={setEditWVPPlanSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default WVPPlanInput;
