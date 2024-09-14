import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { Unit } from "../../../types/entities";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUnits, getUnitBySlug } from "../../../queries/organizations";
import { classNames } from "../../../utils/core";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { SimpleChangeEvent } from "../../../types/core";
import PillBadge from "../../PillBadge";

type ConditionalUnit<M> = M extends true
  ? Unit[]
  : Unit | string | null | undefined;

interface UnitSelectProps<M extends boolean | undefined> {
  value: ConditionalUnit<M>;
  onChange?: (event: SimpleChangeEvent<ConditionalUnit<M>>) => void;
  name?: string;
  label?: string;
  many?: M;
  required?: boolean;
  queryFilter?: Record<string, string>;
}

const UnitSelect = <M extends boolean | undefined = false>({
  value,
  onChange,
  name,
  label,
  many,
  required,
  queryFilter,
}: UnitSelectProps<M>) => {
  const [unitQuery, setUnitQuery] = useState<string>("");

  const unitQueryDebounce = useRef<number>();

  const selectedUnitsLength = Array.isArray(value)
    ? value.length
    : value
    ? 1
    : 0;
  const { data: unitData } = useQuery({
    queryKey: ["units", unitQuery, queryFilter, selectedUnitsLength] as const,
    queryFn: ({ queryKey }) =>
      getUnits({
        search: queryKey[1] || undefined,
        limit: 5 + queryKey[3],
        order: { name: "ASC" },
        ...queryFilter,
      }),
  });

  const { data: selectedUnit } = useQuery({
    queryKey: ["unit", value] as const,
    queryFn: ({ queryKey }) => getUnitBySlug(queryKey[1] as string),
    enabled: !!value && typeof value === "string",
  });

  const handleQueryUnit = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(unitQueryDebounce.current);
    unitQueryDebounce.current = setTimeout(() => {
      setUnitQuery(event.target.value);
    }, 350);
  };

  const units = useMemo(() => {
    return unitData?.results
      ?.filter((unit) => {
        if (Array.isArray(value)) {
          return !value.some((u) =>
            typeof u === "string" ? u === unit.slug : u.id === unit.id
          );
        }
        if (value) {
          return typeof value === "string"
            ? value === unit.slug
            : value.id !== unit.id;
        }
        return true;
      })
      ?.slice(0, 5);
  }, [unitData, value]);

  const handleChange = (units: ConditionalUnit<M>) => {
    if (many && !Array.isArray(units) && units) {
      handleAddUnit(units);
      return;
    }

    onChange?.({
      type: "change",
      target: {
        name: name ?? "unit",
        value: units,
      },
    });
  };

  const handleAddUnit = (unit: Unit | string) => {
    if (!many || !Array.isArray(value)) {
      return;
    }
    handleChange([...value, unit] as ConditionalUnit<M>);
  };

  const handleRemoveUnit = (unit: Unit) => {
    if (!many || !Array.isArray(value)) {
      return;
    }
    handleChange(value.filter((o) => o.id !== unit.id) as ConditionalUnit<M>);
  };

  return (
    <div>
      <Combobox
        as="div"
        immediate
        onChange={handleChange as any}
        value={
          value ?? ((many ? [] : { name: "" }) as ConditionalUnit<M> as any)
        }
        className="relative"
        aria-required={required}
      >
        {label && (
          <Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            {label}
          </Label>
        )}
        <div className="relative">
          <ComboboxInput
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
            onChange={handleQueryUnit}
            displayValue={(unit: Unit | string) =>
              many
                ? ""
                : typeof unit === "string"
                ? selectedUnit?.name ?? ""
                : unit?.name
            }
            placeholder="Search for a unit..."
            type="search"
            required={required}
          />
          {!many && value && (
            <button
              type="button"
              onClick={() => handleChange(null as ConditionalUnit<M>)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          )}
          {units && (
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {units.length === 0 && (
                <ComboboxOption
                  value={null}
                  disabled={true}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
                >
                  No results
                </ComboboxOption>
              )}
              {units.map((unit) => (
                <ComboboxOption
                  key={unit?.id ?? -1}
                  value={unit}
                  className={({ focus }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-3 pr-9",
                      focus ? "bg-secondary-600 text-white" : "text-gray-900"
                    )
                  }
                >
                  <span className="block truncate">
                    {unit?.name ?? "Any unit"}
                  </span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          )}
        </div>
      </Combobox>
      {many && (
        <div className="flex gap-2 flex-wrap mt-3">
          {Array.isArray(value) && value.length > 0 ? (
            value.map((unit) => (
              <PillBadge
                key={unit.id}
                value={unit}
                displayValue={unit.name}
                color="blue"
                isRemovable={true}
                onRemove={() => handleRemoveUnit(unit)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-400 italic">
              No units selected
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitSelect;
