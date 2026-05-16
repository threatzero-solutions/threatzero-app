import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import { MouseEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import Input from "../../../components/forms/inputs/Input";
import Select from "../../../components/forms/inputs/Select";
import DataTable from "../../../components/layouts/tables/DataTable";
import { IDP_PROFILE_FIELDS } from "../../../constants/idp-profile-fields";
import { OrganizationIdpDto, SyncAttributeDto } from "../../../types/api";

const AddAttributeButton: React.FC<{
  value?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}> = ({ value = "+ Add", onClick = () => {} }) => {
  return (
    <button
      type="button"
      className="w-max self-center text-sm text-secondary-600 hover:text-secondary-700 transition-colors"
      onClick={onClick}
    >
      {value}
    </button>
  );
};

const DEFAULT_SYNC_ATTRIBUTE: SyncAttributeDto = {
  externalName: "",
  internalName: "",
};

const PROFILE_FIELD_OPTIONS = IDP_PROFILE_FIELDS.map(({ value, label }) => ({
  key: value,
  label,
}));

const SyncAttributesInput: React.FC = () => {
  const { control } = useFormContext<OrganizationIdpDto>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "syncAttributes",
  });

  return (
    <div className="flex flex-col">
      <DataTable
        dense
        data={{
          headers: [
            {
              label: "IDP claim",
              key: "externalName",
            },
            {
              label: "",
              key: "arrowSeparator",
              noSort: true,
            },
            {
              label: "Profile field",
              key: "internalName",
            },
            {
              label: <span className="sr-only">Delete claim mapping</span>,
              key: "delete",
              align: "right",
              noSort: true,
            },
          ],
          rows: fields.map((field, idx) => ({
            id: `${idx}`,
            externalName: (
              <Input
                value={field.externalName ?? ""}
                className="w-full"
                onChange={(e) =>
                  update(idx, { ...field, externalName: e.target.value })
                }
                placeholder="e.g. given_name, department"
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            internalName: (
              <Select
                value={field.internalName ?? ""}
                onChange={(e) =>
                  update(idx, { ...field, internalName: e.target.value })
                }
                options={PROFILE_FIELD_OPTIONS}
                required
              />
            ),
            delete: (
              <button type="button" onClick={() => remove(idx)}>
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          })),
        }}
        notFoundDetail={
          <AddAttributeButton
            value="+ Add claim mapping"
            onClick={() => append(DEFAULT_SYNC_ATTRIBUTE)}
          />
        }
      />
      {fields.length > 0 && (
        <AddAttributeButton
          value="+ Add claim mapping"
          onClick={() => append(DEFAULT_SYNC_ATTRIBUTE)}
        />
      )}
    </div>
  );
};

export default SyncAttributesInput;
