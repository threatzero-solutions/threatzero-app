import { OrganizationIdpDto, UnitMatcherDto } from "../../../../types/api";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent } from "react";
import UnitSelect from "../../../../components/forms/inputs/UnitSelect";
import { Organization, Unit } from "../../../../types/entities";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { useFormContext, useFieldArray } from "react-hook-form";

interface UnitMatchersInputProps {
  organizationId: Organization["id"];
}

const AddUnitMatcherButton: React.FC<{
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

const DEFAULT_MATCHER: UnitMatcherDto = {
  externalName: "",
  pattern: "",
  unitSlug: "",
};

const UnitMatchersInput: React.FC<UnitMatchersInputProps> = ({
  organizationId,
}) => {
  const { control } = useFormContext<OrganizationIdpDto>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "unitMatchers",
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
              key: "matchesSeparator",
              noSort: true,
            },
            {
              label: "Pattern",
              key: "pattern",
            },
            {
              label: "",
              key: "arrowSeparator",
              noSort: true,
            },
            {
              label: "Unit",
              key: "unitSlug",
            },
            {
              label: <span className="sr-only">Delete Unit Matcher</span>,
              key: "delete",
              align: "right",
              noSort: true,
            },
          ],
          rows: fields.map((field, idx) => ({
            id: field.attributeId ?? idx.toString(),
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
            matchesSeparator: <PuzzlePieceIcon className="w-4 h-4" />,
            pattern: (
              <Input
                value={field.pattern ?? ""}
                className="w-full"
                onChange={(e) =>
                  update(idx, { ...field, pattern: e.target.value })
                }
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            unitSlug: (
              <UnitSelect
                value={field.unitSlug}
                onChange={(e) => {
                  let newValue = e.target?.value;
                  if (newValue && typeof newValue !== "string") {
                    newValue = (newValue as Unit).slug;
                  }
                  update(idx, {
                    ...field,
                    unitSlug: newValue ?? "",
                  });
                }}
                queryFilter={{ ["organization.id"]: organizationId }}
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
          <AddUnitMatcherButton
            value="+ Add a unit matcher"
            onClick={() => append(DEFAULT_MATCHER)}
          />
        }
      />
      {fields.length > 0 && (
        <AddUnitMatcherButton onClick={() => append(DEFAULT_MATCHER)} />
      )}
    </div>
  );
};

export default UnitMatchersInput;
