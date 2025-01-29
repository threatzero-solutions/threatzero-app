import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useMemo } from "react";
import { useOpenData } from "../../hooks/use-open-data";
import { OrganizationPolicyFile } from "../../types/entities";
import FormField from "../forms/FormField";
import ButtonGroup from "../layouts/buttons/ButtonGroup";
import IconButton from "../layouts/buttons/IconButton";
import Block from "../layouts/content/Block";
import SlideOver from "../layouts/slide-over/SlideOver";
import EditOrganizationPolicyFile from "./EditOrganizationPolicyFile";

interface PolicyProcedureInputProps {
  generatePolicyUploadsUrlsUrl: string;
  value?: Partial<OrganizationPolicyFile>[];
  onValueChange?: (data: Partial<OrganizationPolicyFile>[]) => void;
  name?: string;
  label?: string;
  helpText?: string;
}

const PolicyProcedureInput: React.FC<PolicyProcedureInputProps> = ({
  generatePolicyUploadsUrlsUrl,
  value,
  onValueChange,
  name,
  label,
  helpText,
}) => {
  const editPolicyProcedure = useOpenData<Partial<OrganizationPolicyFile>>();

  const handleChange = (updatedValue: Partial<OrganizationPolicyFile>[]) => {
    onValueChange?.(
      updatedValue.map((v) => ({
        ...v,
        id: v.id?.startsWith("TEMP-ID-") ? undefined : v.id,
      }))
    );
  };

  const localValue = useMemo(
    () =>
      (value ?? []).map((v) => ({
        ...v,
        id: v.id ?? "TEMP-ID-" + Math.random(),
      })),
    [value]
  );

  const handleRemoveOrganizationPolicyFile = (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => {
    handleChange(localValue.filter((v) => v.id !== organizationPolicyFile.id));
  };

  const handleSaveOrganizationPolicyFile = (
    organizationPolicyFile: Partial<OrganizationPolicyFile>
  ) => {
    editPolicyProcedure.close();

    const newValue = organizationPolicyFile.id
      ? localValue.map((v) => {
          if (v.id === organizationPolicyFile.id) {
            return organizationPolicyFile;
          }
          return v;
        })
      : [
          ...localValue,
          { ...organizationPolicyFile, id: "TEMP-ID-" + Math.random() },
        ];

    handleChange(newValue);
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
            icon={PlusIcon}
            className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
            text="Add Policy or Procedure"
            type="button"
            onClick={() => editPolicyProcedure.openNew()}
          />
        }
        input={
          <div className="flex flex-col gap-2">
            {localValue.map((v) => (
              <Block
                className="flex items-center justify-between bg-gray-50"
                key={v.id}
              >
                <button
                  className="text-sm font-semibold bg-gray-50"
                  onClick={() => editPolicyProcedure.openData(v)}
                >
                  {v.name ?? v.pdfS3Key ?? ""}{" "}
                  <span className="text-xs font-normal">(edit)</span>
                </button>
                <ButtonGroup>
                  <IconButton
                    icon={XMarkIcon}
                    className="bg-red-500 ring-transparent text-white hover:bg-red-600"
                    text="Remove"
                    type="button"
                    onClick={() => handleRemoveOrganizationPolicyFile(v)}
                  />
                </ButtonGroup>
              </Block>
            ))}
            {localValue.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center w-full">
                No policy or procedures have been added.
              </p>
            )}
          </div>
        }
      />
      <SlideOver
        open={editPolicyProcedure.open}
        setOpen={editPolicyProcedure.setOpen}
      >
        <EditOrganizationPolicyFile
          generatePolicyUploadsUrlsUrl={generatePolicyUploadsUrlsUrl}
          organizationPolicyFile={editPolicyProcedure.data ?? undefined}
          onSave={handleSaveOrganizationPolicyFile}
          setOpen={editPolicyProcedure.setOpen}
        />
      </SlideOver>
    </>
  );
};

export default PolicyProcedureInput;
