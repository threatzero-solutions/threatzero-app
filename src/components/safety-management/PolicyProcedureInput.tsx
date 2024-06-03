import { useState } from "react";
import { SimpleChangeEvent } from "../../types/core";
import { OrganizationPolicyFile } from "../../types/entities";
import SlideOver from "../layouts/slide-over/SlideOver";
import EditOrganizationPolicyFile from "./EditOrganizationPolicyFile";
import Input from "../forms/inputs/Input";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface PolicyProcedureInputProps {
  value?: Partial<OrganizationPolicyFile>[];
  onChange?: (
    event: SimpleChangeEvent<Partial<OrganizationPolicyFile>[]>
  ) => void;
  name?: string;
}

const PolicyProcedureInput: React.FC<PolicyProcedureInputProps> = ({
  value,
  onChange,
  name,
}) => {
  const [editPolicyProcedureSliderOpen, setPolicyProcedureSliderOpen] =
    useState(false);

  const [activeOrganizationPolicyFile, setActiveOrganizationPolicyFile] =
    useState<Partial<OrganizationPolicyFile>>();

  const handleChange = (updatedValue: Partial<OrganizationPolicyFile>[]) => {
    onChange?.({
      target: {
        name: name ?? "policyAndProcedures",
        value: updatedValue,
      },
    });
  };

  const handleNewOrganizationPolicyFile = () => {
    setActiveOrganizationPolicyFile(undefined);
    setPolicyProcedureSliderOpen(true);
  };

  const handleEditOrganizationPolicyFile = (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => {
    setActiveOrganizationPolicyFile(organizationPolicyFile);
    setPolicyProcedureSliderOpen(true);
  };

  const handleRemoveOrganizationPolicyFile = (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => {
    handleChange(
      (value ?? []).filter((v) => v.id !== organizationPolicyFile.id)
    );
  };

  const handleSaveOrganizationPolicyFile = (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => {
    setPolicyProcedureSliderOpen(false);

    const newValue = organizationPolicyFile.id
      ? (value ?? []).map((v) => {
          if (v.id === organizationPolicyFile.id) {
            return organizationPolicyFile;
          }
          return v;
        })
      : [
          ...(value ?? []),
          { ...organizationPolicyFile, id: "TEMP-ID-" + Math.random() },
        ];

    handleChange(
      newValue.map((v) => ({
        ...v,
        id: v.id?.startsWith("TEMP-ID-") ? undefined : v.id,
      }))
    );
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {value?.map((v) => (
          <div className="relative w-full">
            <Input
              key={v.id}
              className="w-full pr-10"
              value={v.name ?? v.pdfS3Key ?? ""}
              readOnly
              onClick={() => handleEditOrganizationPolicyFile(v)}
            />
            <div
              className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 opacity-100 hover:opacity-75 transition-opacity"
              onClick={() => handleRemoveOrganizationPolicyFile(v)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleNewOrganizationPolicyFile()}
          className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Add Policy or Procedure
        </button>
      </div>
      <SlideOver
        open={editPolicyProcedureSliderOpen}
        setOpen={setPolicyProcedureSliderOpen}
      >
        <EditOrganizationPolicyFile
          organizationPolicyFile={activeOrganizationPolicyFile}
          setOrganizationPolicyFile={handleSaveOrganizationPolicyFile}
          setOpen={setPolicyProcedureSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default PolicyProcedureInput;
