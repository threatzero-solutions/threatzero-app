import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Unit, Field, FieldType } from "../../../../types/entities";
import { orderSort, slugify } from "../../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saveUnit,
  deleteUnit,
  saveLocation,
} from "../../../../queries/organizations";
import OrganizationSelect from "../../../../components/forms/inputs/OrganizationSelect";
import FormInput from "../../../../components/forms/inputs/FormInput";
import { useImmer } from "use-immer";

const INPUT_DATA: Array<
  Partial<Field> & { name: keyof Unit | "autoAddLocation" }
> = [
  {
    name: "organization",
    label: "Organization",
    helpText: "The organization this unit belongs to.",
    type: FieldType.SELECT,
    required: true,
    order: 1,
  },
  {
    name: "name",
    label: "Name",
    helpText: "A friendly name for this unit.",
    type: FieldType.TEXT,
    required: true,
    order: 2,
  },
  {
    name: "slug",
    label: "Slug",
    helpText: "The slug field must be unique.",
    type: FieldType.TEXT,
    required: true,
    order: 3,
  },
  {
    name: "address",
    label: "Address (Optional)",
    type: FieldType.TEXTAREA,
    elementProperties: {
      rows: 3,
    },
    required: false,
    order: 4,
  },
  {
    name: "autoAddLocation",
    label: "Automatically Add Location",
    helpText:
      "Automatically create a new location with the same name for this unit",
    type: FieldType.CHECKBOX,
    required: false,
    order: 5,
  },
  {
    name: "groupId",
    label: "Group ID",
    helpText:
      "This id correlates with the unit's Group ID in the identity provider.",
    placeholder: "Automatically generated",
    type: FieldType.TEXT,
    elementProperties: {
      disabled: true,
    },
    required: false,
    order: 6,
  },
];

interface EditUnitProps {
  setOpen: (open: boolean) => void;
  unit?: Partial<Unit>;
}

const EditUnit: React.FC<EditUnitProps> = ({ setOpen, unit: unitProp }) => {
  const [unit, setUnit] = useImmer<Partial<Unit>>({});
  const [autoAddLocation, setAutoAddLocation] = useState(false);

  const isNew = useMemo(() => !unitProp, [unitProp]);

  const createNewSlug = useRef(true);
  const slugDebounceTimeout = useRef<number>();

  const queryClient = useQueryClient();

  const saveLocationMutation = useMutation({
    mutationFn: saveLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
    },
  });

  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["units"],
    });
    setOpen(false);
  };
  const saveUnitMutation = useMutation({
    mutationFn: saveUnit,
    onSuccess: (newUnit) => {
      onMutateSuccess();

      if (autoAddLocation) {
        saveLocationMutation.mutate({
          name: newUnit.name,
          unit: {
            id: newUnit.id,
          },
        });
      }
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: onMutateSuccess,
  });

  useEffect(() => {
    if (unitProp) {
      createNewSlug.current = false;
      setUnit((u) => ({
        ...u,
        ...unitProp,
      }));
    }
  }, [unitProp]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = event.target.value;
    if (event.target.name === "slug") {
      value = slugify(value, false);

      createNewSlug.current = !value;

      clearTimeout(slugDebounceTimeout.current);
      slugDebounceTimeout.current = setTimeout(() => {
        setUnit((a) => ({
          ...a,
          slug: slugify(value),
        }));
      }, 1000);
    }

    setUnit((u) => {
      u[event.target.name as keyof Omit<Unit, "organization">] = value;

      if (createNewSlug.current && event.target.name === "name") {
        u.slug = slugify(value);
      }
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    saveUnitMutation.mutate({
      ...unit,
      slug: slugify(unit.slug ?? ""),
    });
  };

  const handleDelete = () => {
    deleteUnitMutation.mutate(unit.id);
  };

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                {isNew ? "Add unit" : "Edit unit"}
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Units are the parts that make up an organization, such as a
                school in a district. They generally represent a school, office,
                or other general location where unit members work or attend
                school.
              </p>
            </div>
            <div className="flex h-7 items-center">
              <button
                type="button"
                className="relative text-gray-400 hover:text-gray-500"
                onClick={() => setOpen(false)}
              >
                <span className="absolute -inset-2.5" />
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider container */}
        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          {INPUT_DATA.sort(orderSort)
            .filter((input) => input.name !== "autoAddLocation" || isNew)
            .map((input) => (
              <div
                key={input.name}
                className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5"
              >
                <div>
                  <label
                    htmlFor={input.name}
                    className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
                  >
                    {input.label}
                  </label>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  {input.name === "organization" ? (
                    <OrganizationSelect
                      value={unit.organization}
                      onChange={(e) =>
                        setUnit((u) => ({
                          ...u,
                          organization: e.target?.value ?? undefined,
                        }))
                      }
                    />
                  ) : input.name === "autoAddLocation" ? (
                    <FormInput
                      field={input}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAutoAddLocation(e.target.checked)
                      }
                      value={autoAddLocation}
                    />
                  ) : (
                    <FormInput
                      field={input}
                      onChange={handleChange}
                      value={unit[input.name as keyof Unit] ?? ""}
                    />
                  )}
                  {input.helpText && (
                    <p className="text-sm text-gray-500">{input.helpText}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          {!isNew && (
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <div className="grow" />
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditUnit;
