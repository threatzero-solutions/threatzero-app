import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Location, Field, FieldType, Unit } from "../../../../types/entities";
import { classNames, orderSort } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveLocation,
  deleteLocation,
  getUnits,
} from "../../../../queries/organizations";
import FormInput from "../../../../components/forms/inputs/FormInput";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import { CoreContext } from "../../../../contexts/core/core-context";
import { useDebounceValue } from "usehooks-ts";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Location }> = [
  {
    name: "unit",
    label: "Unit",
    helpText: "This location's unit.",
    type: FieldType.SELECT,
    required: true,
    order: 1,
  },
  {
    name: "name",
    label: "Name",
    helpText: "A friendly name for this location.",
    type: FieldType.TEXT,
    required: true,
    order: 2,
  },
  {
    name: "locationId",
    label: "Location ID",
    type: FieldType.TEXT,
    placeholder: "Automatically generated",
    helpText: "A unique identifier for tying QR codes to locations.",
    elementProperties: {
      disabled: true,
    },
    required: false,
    order: 3,
  },
];

interface EditLocationProps {
  setOpen: (open: boolean) => void;
  location?: Partial<Location>;
}

const EditLocation: React.FC<EditLocationProps> = ({
  setOpen,
  location: locationProp,
}) => {
  const [location, setLocation] = useState<Partial<Location>>({});
  const [unitQuery, setUnitQuery] = useState<string>("");

  const isNew = useMemo(() => !locationProp, [locationProp]);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const [debouncedUnitQuery] = useDebounceValue(unitQuery, 350);
  const { data: units } = useQuery({
    queryKey: ["units", { search: debouncedUnitQuery, limit: 5 }] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
  });

  const queryClient = useQueryClient();
  const saveLocationMutation = useMutation({
    mutationFn: saveLocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["location", "id", data.id],
      });
      setOpen(false);
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
      setOpen(false);
      setConfirmationClose();
    },
  });

  useEffect(() => {
    setLocation((a) => ({
      ...a,
      ...(locationProp ?? {}),
    }));
  }, [locationProp]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;

    setLocation((a) => ({
      ...a,
      [event.target.name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    saveLocationMutation.mutate(location);
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${location.name} Location`,
      message: `Are you sure you want to delete this location?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteLocationMutation.mutate(location.id);
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={saveLocationMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add location" : "Edit location"}
        description={`Locations belong to organizational units, and they correlate to
                physical locations within a school, office, etc. Each location
                will have its own QR code.`}
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            {input.name === "unit" ? (
              <Combobox
                as="div"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={location.unit ?? ({} as Unit as any)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(v) => setLocation((l) => ({ ...l, unit: v })) as any}
                className="relative"
              >
                <ComboboxInput
                  className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
                  onChange={(e) => setUnitQuery(e.target.value)}
                  displayValue={(unit: Unit) => unit?.name}
                  type="search"
                  placeholder="Search for a unit..."
                />
                {!!units?.results && units.results.length > 0 && (
                  <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {units?.results.map((unit) => (
                      <ComboboxOption
                        key={unit.id}
                        value={unit}
                        className={({ focus }) =>
                          classNames(
                            "relative cursor-default select-none py-2 pl-3 pr-9",
                            focus
                              ? "bg-secondary-600 text-white"
                              : "text-gray-900"
                          )
                        }
                      >
                        <span className="block truncate">{unit.name}</span>
                      </ComboboxOption>
                    ))}
                  </ComboboxOptions>
                )}
              </Combobox>
            ) : (
              <FormInput
                field={input}
                onChange={handleChange}
                value={location[input.name as keyof Location] ?? ""}
              />
            )}
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditLocation;
