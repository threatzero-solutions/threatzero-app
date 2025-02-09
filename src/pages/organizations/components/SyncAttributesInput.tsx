import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import { MouseEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import Input from "../../../components/forms/inputs/Input";
import DataTable from "../../../components/layouts/tables/DataTable";
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
              label: "External Name",
              key: "externalName",
            },
            {
              label: "",
              key: "arrowSeparator",
              noSort: true,
            },
            {
              label: "ThreatZero Name",
              key: "internalName",
            },
            {
              label: <span className="sr-only">Delete Unit Matcher</span>,
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
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            internalName: (
              <Input
                value={field.internalName ?? ""}
                className="w-full"
                onChange={(e) =>
                  update(idx, { ...field, internalName: e.target.value })
                }
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
            value="+ Add a sync attribute"
            onClick={() => append(DEFAULT_SYNC_ATTRIBUTE)}
          />
        }
      />
      {fields.length > 0 && (
        <AddAttributeButton onClick={() => append(DEFAULT_SYNC_ATTRIBUTE)} />
      )}
    </div>
  );
};

export default SyncAttributesInput;
