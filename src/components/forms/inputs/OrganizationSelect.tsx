import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import {
  getOrganizationBySlug,
  getOrganizations,
} from "../../../queries/organizations";
import { SimpleChangeEvent } from "../../../types/core";
import { Organization } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import PillBadge from "../../PillBadge";

type ConditionalOrganization<M> = M extends true
  ? Organization[]
  : Organization | string | null | undefined;

interface OrganizationSelectProps<M extends boolean | undefined> {
  value: ConditionalOrganization<M>;
  onChange?: (event: SimpleChangeEvent<ConditionalOrganization<M>>) => void;
  name?: string;
  label?: string;
  many?: M;
  required?: boolean;
}

const OrganizationSelect = <M extends boolean | undefined = false>({
  value,
  onChange,
  name,
  label,
  many,
  required,
}: OrganizationSelectProps<M>) => {
  const [organizationQuery, setOrganizationQuery] = useState<string>("");
  const [debouncedOrganizationQuery] = useDebounceValue(organizationQuery, 350);

  const selectedOrganizationsLength = Array.isArray(value)
    ? value.length
    : value
    ? 1
    : 0;
  const { data: organizationData } = useQuery({
    queryKey: [
      "organizations",
      debouncedOrganizationQuery,
      selectedOrganizationsLength,
    ] as const,
    queryFn: ({ queryKey }) =>
      getOrganizations({
        search: queryKey[1] || undefined,
        limit: 5 + queryKey[2],
        order: { name: "ASC" },
      }),
  });

  const { data: selectedOrganization } = useQuery({
    queryKey: ["organization", "slug", value] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationBySlug(queryKey[2] as string).catch(() => null),
    enabled: !!value && typeof value === "string",
  });

  const organizations = useMemo(() => {
    return organizationData?.results
      ?.filter((org) => {
        if (Array.isArray(value)) {
          return !value.some((o) =>
            typeof o === "string" ? o === org.slug : o.id === org.id
          );
        }
        if (value) {
          return typeof value === "string"
            ? value === org.slug
            : value.id !== org.id;
        }
        return true;
      })
      ?.slice(0, 5);
  }, [organizationData, value]);

  const handleChange = (organizations: ConditionalOrganization<M>) => {
    if (many && !Array.isArray(organizations) && organizations) {
      handleAddOrganization(organizations);
      return;
    }

    onChange?.({
      type: "change",
      target: {
        name: name ?? "organization",
        value: organizations,
      },
    });
  };

  const handleAddOrganization = (organization: Organization | string) => {
    if (!many || !Array.isArray(value)) {
      return;
    }
    handleChange([...value, organization] as ConditionalOrganization<M>);
  };

  const handleRemoveOrganization = (organization: Organization) => {
    if (!many || !Array.isArray(value)) {
      return;
    }
    handleChange(
      value.filter(
        (o) => o.id !== organization.id
      ) as ConditionalOrganization<M>
    );
  };

  return (
    <div>
      <Combobox
        as="div"
        immediate
        onChange={handleChange as (value: unknown) => void}
        value={
          value ??
          ((many ? [] : { name: "" }) as ConditionalOrganization<M> as unknown)
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
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
            onChange={(e) => setOrganizationQuery(e.target.value)}
            displayValue={(organization: Organization) =>
              many
                ? ""
                : typeof organization === "string"
                ? selectedOrganization?.name ?? ""
                : organization?.name
            }
            placeholder="Search for an organization..."
            type="search"
            required={required}
          />
          {!many && value && (
            <button
              type="button"
              onClick={() => handleChange(null as ConditionalOrganization<M>)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          )}
          {organizations && (
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm">
              {organizations.length === 0 && (
                <ComboboxOption
                  value={null}
                  disabled={true}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
                >
                  No results
                </ComboboxOption>
              )}
              {organizations.map((organization) => (
                <ComboboxOption
                  key={organization?.id ?? -1}
                  value={organization}
                  className={({ focus }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-3 pr-9",
                      focus ? "bg-secondary-600 text-white" : "text-gray-900"
                    )
                  }
                >
                  <span className="block truncate">
                    {organization?.name ?? "Any organization"}
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
            value.map((org) => (
              <PillBadge
                key={org.id}
                value={org}
                displayValue={org.name}
                color="blue"
                isRemovable={true}
                onRemove={() => handleRemoveOrganization(org)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-400 italic">
              No organizations selected
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationSelect;
