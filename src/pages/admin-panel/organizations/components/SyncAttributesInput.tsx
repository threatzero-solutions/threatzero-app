import { useImmer } from "use-immer";
import { SyncAttributeDto } from "../../../../types/api";
import { SimpleChangeEvent } from "../../../../types/core";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import { MouseEvent, useEffect } from "react";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";

interface SyncAttributesInputProps<K extends string | number | symbol> {
  name: K;
  value?: SyncAttributeDto[];
  onChange?: (e: SimpleChangeEvent<SyncAttributeDto[], K>) => void;
}

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

const SyncAttributesInput = <K extends string | number | symbol>({
  name,
  value,
  onChange,
}: SyncAttributesInputProps<K>) => {
  const [attributes, setAttributes] = useImmer<SyncAttributeDto[]>(value ?? []);

  const handleAddAttribute = () => {
    setAttributes((draft) => {
      draft.push({
        externalName: "",
        internalName: "",
      });
    });
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes((draft) => {
      draft.splice(idx, 1);
    });
  };

  const handleUpdateAttribute = (
    idx: number,
    key: keyof SyncAttributeDto,
    e: SimpleChangeEvent<string | null | undefined>
  ) => {
    setAttributes((draft) => {
      draft[idx][key] = e.target?.value ?? "";
    });
  };

  useEffect(() => {
    onChange?.({ target: { name, value: attributes } });
  }, [attributes, onChange, name]);

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
          rows: attributes.map((a, idx) => ({
            id: `${idx}`,
            externalName: (
              <Input
                value={a.externalName ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateAttribute(idx, "externalName", e)}
                required
              />
            ),
            arrowSeparator: <ArrowRightIcon className="w-4 h-4" />,
            internalName: (
              <Input
                value={a.internalName ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateAttribute(idx, "internalName", e)}
                required
              />
            ),
            delete: (
              <button type="button" onClick={() => handleRemoveAttribute(idx)}>
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          })),
        }}
        notFoundDetail={
          <AddAttributeButton
            value="+ Add a sync attribute"
            onClick={handleAddAttribute}
          />
        }
      />
      {attributes.length > 0 && (
        <AddAttributeButton onClick={handleAddAttribute} />
      )}
    </div>
  );
};

export default SyncAttributesInput;
