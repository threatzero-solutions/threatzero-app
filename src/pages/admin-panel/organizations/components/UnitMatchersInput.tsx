import { useImmer } from "use-immer";
import { UnitMatcherDto } from "../../../../types/api";
import { SimpleChangeEvent } from "../../../../types/core";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent, useEffect } from "react";
import UnitSelect from "../../../../components/forms/inputs/UnitSelect";
import { Organization, Unit } from "../../../../types/entities";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";

interface UnitMatchersInputProps<K extends string | number | symbol> {
  name: K;
  value?: UnitMatcherDto[];
  onChange?: (e: SimpleChangeEvent<UnitMatcherDto[], K>) => void;
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

const UnitMatchersInput = <K extends string | number | symbol = string>({
  name,
  value,
  onChange,
  organizationId,
}: UnitMatchersInputProps<K>) => {
  const [unitMatchers, setUnitMatchers] = useImmer<UnitMatcherDto[]>(
    value ?? []
  );

  const handleAddMatcher = () => {
    setUnitMatchers((draft) => {
      draft.push({
        externalName: "",
        pattern: "",
        unitSlug: "",
      });
    });
  };

  const handleRemoveMatcher = (idx: number) => {
    setUnitMatchers((draft) => {
      draft.splice(idx, 1);
    });
  };

  const handleUpdateMatcher = (
    idx: number,
    key: keyof UnitMatcherDto,
    e: SimpleChangeEvent<string | Unit | null | undefined>
  ) => {
    setUnitMatchers((draft) => {
      let value = e.target?.value;
      if (key === "unitSlug" && value && typeof value !== "string") {
        value = (value as Unit).slug;
      }

      draft[idx][key] = (value ?? "") as string;
    });
  };

  useEffect(() => {
    onChange?.({ target: { name, value: unitMatchers } });
  }, [unitMatchers, onChange, name]);

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
          rows: unitMatchers.map((u, idx) => ({
            id: u.attributeId ?? idx.toString(),
            externalName: (
              <Input
                value={u.externalName ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "externalName", e)}
                required
              />
            ),
            matchesSeparator: <PuzzlePieceIcon className="w-4 h-4" />,
            pattern: (
              <Input
                value={u.pattern ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "pattern", e)}
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            unitSlug: (
              <UnitSelect
                value={u.unitSlug}
                onChange={(e) => handleUpdateMatcher(idx, "unitSlug", e)}
                queryFilter={{ ["organization.id"]: organizationId }}
              />
            ),
            delete: (
              <button type="button" onClick={() => handleRemoveMatcher(idx)}>
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          })),
        }}
        notFoundDetail={
          <AddUnitMatcherButton
            value="+ Add a unit matcher"
            onClick={handleAddMatcher}
          />
        }
      />
      {unitMatchers.length > 0 && (
        <AddUnitMatcherButton onClick={handleAddMatcher} />
      )}
    </div>
  );
};

export default UnitMatchersInput;
