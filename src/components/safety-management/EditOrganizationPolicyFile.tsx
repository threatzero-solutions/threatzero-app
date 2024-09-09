import { ChangeEvent, FormEvent, useState } from "react";
import { Field, FieldType, OrganizationPolicyFile } from "../../types/entities";
import FormInput from "../forms/inputs/FormInput";
import { orderSort } from "../../utils/core";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";
import SlideOverForm from "../layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../layouts/slide-over/SlideOverField";

const INPUT_DATA: Array<
  Partial<Field> & { name: keyof OrganizationPolicyFile }
> = [
  {
    name: "name",
    label: "Name",
    helpText: "Name for this policy or procedure.",
    type: FieldType.TEXT,
    required: true,
    order: 0,
  },
  {
    name: "pdfS3Key",
    label: "PDF S3 Key",
    helpText: "S3 key for the plan's PDF file.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
];

interface EditOrganizationPolicyFileProps {
  organizationPolicyFile?: Partial<OrganizationPolicyFile>;
  setOrganizationPolicyFile: (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => void;
  setOpen: (open: boolean) => void;
}

const EditOrganizationPolicyFile: React.FC<EditOrganizationPolicyFileProps> = ({
  organizationPolicyFile,
  setOrganizationPolicyFile,
  setOpen,
}) => {
  const [tempOrganizationPolicyFile, setTempOrganizationPolicyFile] = useState<
    Partial<OrganizationPolicyFile>
  >(organizationPolicyFile ?? {});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempOrganizationPolicyFile((v) => ({
      ...v,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setOrganizationPolicyFile(tempOrganizationPolicyFile);
    setOpen(false);
  };
  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      submitText="Done"
    >
      <SlideOverHeading
        title={
          organizationPolicyFile
            ? "Add Policy or Procedure"
            : "Edit Policy or Procedure"
        }
        description="Manage this organization policy or procedure."
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
              value={
                tempOrganizationPolicyFile[
                  input.name as keyof OrganizationPolicyFile
                ] ?? ""
              }
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationPolicyFile;
