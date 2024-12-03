import {
  KeycloakGroupDto,
  OrganizationIdpDto,
  RoleGroupMatcherDto,
} from "../../../../types/api";
import DataTable from "../../../../components/layouts/tables/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent } from "react";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import Select from "../../../../components/forms/inputs/Select";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { useFieldArray, useFormContext } from "react-hook-form";

interface RoleGroupMatchersInputProps {
  allowedRoleGroups: KeycloakGroupDto[];
  checkDisabled: (m: RoleGroupMatcherDto) => boolean;
}

const AddMatcherButton: React.FC<{
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

const DEFAULT_MATCHER: RoleGroupMatcherDto = {
  externalName: "",
  pattern: "",
  roleGroup: "",
};

const RoleGroupMatchersInput: React.FC<RoleGroupMatchersInputProps> = ({
  allowedRoleGroups,
  checkDisabled,
}) => {
  const { control } = useFormContext<OrganizationIdpDto>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "roleGroupMatchers",
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
              label: "Role Group",
              key: "roleGroup",
            },
            {
              label: <span className="sr-only">Delete Role Group Matcher</span>,
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
                readOnly={checkDisabled(field)}
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
                readOnly={checkDisabled(field)}
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            roleGroup: (
              <Select
                value={field.roleGroup}
                onChange={(e) =>
                  update(idx, { ...field, roleGroup: e.target.value })
                }
                options={(allowedRoleGroups ?? []).map((roleGroup) => ({
                  label: roleGroup.name,
                  key: roleGroup.id,
                  disabled: checkDisabled({
                    ...field,
                    roleGroup: roleGroup.name,
                  }),
                }))}
                readOnly={checkDisabled(field)}
              />
            ),
            delete: (
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={checkDisabled(field)}
                className="cursor-pointer disabled:cursor-default disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          })),
        }}
        notFoundDetail={
          <AddMatcherButton
            value="+ Add a role group matcher"
            onClick={() => append(DEFAULT_MATCHER)}
          />
        }
      />
      {fields.length > 0 && (
        <AddMatcherButton onClick={() => append(DEFAULT_MATCHER)} />
      )}
    </div>
  );
};

export default RoleGroupMatchersInput;
