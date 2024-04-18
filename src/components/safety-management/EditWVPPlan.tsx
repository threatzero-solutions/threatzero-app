import { ChangeEvent, FormEvent, useState } from "react";
import {
  Field,
  FieldType,
  WorkplaceViolencePreventionPlan,
} from "../../types/entities";
import FormInput from "../forms/inputs/FormInput";
import { orderSort } from "../../utils/core";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";

const INPUT_DATA: Array<
  Partial<Field> & { name: keyof WorkplaceViolencePreventionPlan }
> = [
  {
    name: "pdfS3Key",
    label: "PDF S3 Key",
    helpText: "S3 key for the plan's PDF file.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
];

interface EditWVPPlanProps {
  wvpPlan?: Partial<WorkplaceViolencePreventionPlan>;
  setWvpPlan: (wvpPlan: Partial<WorkplaceViolencePreventionPlan>) => void;
  setOpen: (open: boolean) => void;
}

const EditWVPPlan: React.FC<EditWVPPlanProps> = ({
  wvpPlan,
  setWvpPlan,
  setOpen,
}) => {
  const [tempWvpPlan, setTempWvpPlan] = useState<
    Partial<WorkplaceViolencePreventionPlan>
  >(wvpPlan ?? {});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempWvpPlan((v) => ({
      ...v,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setWvpPlan(tempWvpPlan);
    setOpen(false);
  };
  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        <SlideOverHeading
          title={wvpPlan ? "Add WVP Plan" : "Edit WVP Plan"}
          description="Manage this organization's Workplace Violence Prevention Plan."
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
                    tempWvpPlan[
                      input.name as keyof WorkplaceViolencePreventionPlan
                    ] ?? ""
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

export default EditWVPPlan;
