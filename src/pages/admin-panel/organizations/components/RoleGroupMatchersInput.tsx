import { useImmer } from "use-immer";
import { RoleGroupMatcherDto } from "../../../../types/api";
import { SimpleChangeEvent } from "../../../../types/core";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/20/solid";
import Select from "../../../../components/forms/inputs/Select";

interface RoleGroupMatchersInputProps<K extends string | number | symbol> {
  name: K;
  value?: RoleGroupMatcherDto[];
  onChange?: (e: SimpleChangeEvent<RoleGroupMatcherDto[], K>) => void;
  allowedRoleGroups: string[];
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

const RoleGroupMatchersInput = <K extends string | number | symbol>({
  name,
  value,
  onChange,
  allowedRoleGroups,
  checkDisabled,
}: RoleGroupMatchersInputProps<K>) => {
  const [matchers, setMatchers] = useImmer<RoleGroupMatcherDto[]>(value ?? []);

  const handleAddMatcher = () => {
    setMatchers((draft) => {
      draft.push({
        externalName: "",
        pattern: "",
        roleGroup: "",
      });
    });
  };

  const handleRemoveMatcher = (idx: number) => {
    setMatchers((draft) => {
      draft.splice(idx, 1);
    });
  };

  const handleUpdateMatcher = (
    idx: number,
    key: keyof RoleGroupMatcherDto,
    e: SimpleChangeEvent<string | null | undefined>
  ) => {
    setMatchers((draft) => {
      let value = e.target?.value;
      draft[idx][key] = (value ?? "") as string;
    });
  };

  useEffect(() => {
    onChange?.({ target: { name, value: matchers } });
  }, [matchers]);

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
              label: "Pattern",
              key: "pattern",
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
          rows: matchers.map((u, idx) => ({
            id: u.attributeId ?? idx.toString(),
            externalName: (
              <Input
                value={u.externalName ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "externalName", e)}
                required
                readOnly={checkDisabled(u)}
              />
            ),
            pattern: (
              <Input
                value={u.pattern ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "pattern", e)}
                required
                readOnly={checkDisabled(u)}
              />
            ),
            roleGroup: (
              <Select
                value={u.roleGroup}
                onChange={(e) => handleUpdateMatcher(idx, "roleGroup", e)}
                options={(allowedRoleGroups ?? []).map((roleGroup) => ({
                  label: roleGroup,
                  key: roleGroup,
                  disabled: checkDisabled({ ...u, roleGroup }),
                }))}
                readOnly={checkDisabled(u)}
              />
            ),
            delete: (
              <button
                type="button"
                onClick={() => handleRemoveMatcher(idx)}
                disabled={checkDisabled(u)}
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
            onClick={handleAddMatcher}
          />
        }
      />
      {matchers.length > 0 && <AddMatcherButton onClick={handleAddMatcher} />}
    </div>
  );
};

export default RoleGroupMatchersInput;
