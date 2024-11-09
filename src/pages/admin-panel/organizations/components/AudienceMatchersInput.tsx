import { AudienceMatcherDto, OrganizationIdpDto } from "../../../../types/api";
import DataTable from "../../../../components/layouts/DataTable";
import Input from "../../../../components/forms/inputs/Input";
import React, { MouseEvent } from "react";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/20/solid";
import Select from "../../../../components/forms/inputs/Select";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { useFieldArray, useFormContext } from "react-hook-form";

interface AudienceMatchersInputProps {
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

const DEFAULT_MATCHER: AudienceMatcherDto = {
  externalName: "",
  pattern: "",
  audience: "",
};

const AudienceMatchersInput: React.FC<AudienceMatchersInputProps> = ({
  allowedAudiences,
}) => {
  const { control } = useFormContext<OrganizationIdpDto>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "audienceMatchers",
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
            audience: (
              <Select
                value={field.audience}
                onChange={(e) =>
                  update(idx, { ...field, audience: e.target.value })
                }
                options={allowedAudiences.map((audience) => ({
                  key: audience,
                  label: audience,
                }))}
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
          <AddMatcherButton
            value="+ Add an audience matcher"
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

export default AudienceMatchersInput;
