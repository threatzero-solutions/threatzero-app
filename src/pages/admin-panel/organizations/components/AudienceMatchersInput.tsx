import { useImmer } from "use-immer";
import { AudienceMatcherDto } from "../../../../types/api";
import { SimpleChangeEvent } from "../../../../types/core";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/20/solid";
import Select from "../../../../components/forms/inputs/Select";

interface AudienceMatchersInputProps<K extends string | number | symbol> {
  name: K;
  value?: AudienceMatcherDto[];
  onChange?: (e: SimpleChangeEvent<AudienceMatcherDto[], K>) => void;
  allowedAudiences: string[];
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

const AudienceMatchersInput = <K extends string | number | symbol = string>({
  name,
  value,
  onChange,
  allowedAudiences,
}: AudienceMatchersInputProps<K>) => {
  const [audienceMatchers, setAudienceMatchers] = useImmer<
    AudienceMatcherDto[]
  >(value ?? []);

  const handleAddMatcher = () => {
    setAudienceMatchers((draft) => {
      draft.push({
        externalName: "",
        pattern: "",
        audience: "",
      });
    });
  };

  const handleRemoveMatcher = (idx: number) => {
    setAudienceMatchers((draft) => {
      draft.splice(idx, 1);
    });
  };

  const handleUpdateMatcher = (
    idx: number,
    key: keyof AudienceMatcherDto,
    e: SimpleChangeEvent<string | null | undefined>
  ) => {
    setAudienceMatchers((draft) => {
      let value = e.target?.value;
      draft[idx][key] = (value ?? "") as string;
    });
  };

  useEffect(() => {
    onChange?.({ target: { name, value: audienceMatchers } });
  }, [audienceMatchers]);

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
              label: "Audience",
              key: "audience",
            },
            {
              label: <span className="sr-only">Delete Audience Matcher</span>,
              key: "delete",
              align: "right",
              noSort: true,
            },
          ],
          rows: audienceMatchers.map((u, idx) => ({
            id: u.attributeId ?? idx.toString(),
            externalName: (
              <Input
                value={u.externalName ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "externalName", e)}
                required
              />
            ),
            pattern: (
              <Input
                value={u.pattern ?? ""}
                className="w-full"
                onChange={(e) => handleUpdateMatcher(idx, "pattern", e)}
                required
              />
            ),
            audience: (
              <Select
                value={u.audience}
                onChange={(e) => handleUpdateMatcher(idx, "audience", e)}
                options={allowedAudiences.map((audience) => ({
                  key: audience,
                  label: audience,
                }))}
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
          <AddMatcherButton
            value="+ Add an audience matcher"
            onClick={handleAddMatcher}
          />
        }
      />
      {audienceMatchers.length > 0 && (
        <AddMatcherButton onClick={handleAddMatcher} />
      )}
    </div>
  );
};

export default AudienceMatchersInput;
