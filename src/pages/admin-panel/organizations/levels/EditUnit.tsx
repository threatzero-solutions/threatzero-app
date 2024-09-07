import {
  ChangeEvent,
  FormEvent,
  useContext,
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
import SafetyContactInput from "../../../../components/safety-management/SafetyContactInput";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import { CoreContext } from "../../../../contexts/core/core-context";

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
    name: "safetyContact",
    label: "Safety Contact",
    type: FieldType.TEXTAREA,
    elementProperties: {
      readOnly: true,
    },
    required: false,
    order: 5,
  },
  {
    name: "autoAddLocation",
    label: "Automatically Add Location",
    helpText:
      "Automatically create a new location with the same name for this unit",
    type: FieldType.CHECKBOX,
    required: false,
    order: 6,
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
    order: 7,
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

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

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
    onSuccess: () => {
      onMutateSuccess();
      setConfirmationClose();
    },
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
      u[
        event.target.name as keyof Omit<
          Unit,
          "organization" | "safetyContact" | "policiesAndProcedures"
        >
      ] = value;

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
    setConfirmationOpen({
      title: `Delete ${unit.name} Unit`,
      message: `Are you sure you want to delete this unit?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteUnitMutation.mutate(unit.id);
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
    >
      <SlideOverHeading
        title={isNew ? "Add unit" : "Edit unit"}
        description={`Units are the parts that make up an organization, such as a
                school in a district. They generally represent a school, office,
                or other general location where unit members work or attend
                school.`}
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        {INPUT_DATA.sort(orderSort)
          .filter((input) => input.name !== "autoAddLocation" || isNew)
          .map((input) => (
            <SlideOverField
              key={input.name}
              label={input.label}
              name={input.name}
              helpText={input.helpText}
            >
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
              ) : input.name === "safetyContact" ? (
                <SafetyContactInput
                  value={unit.safetyContact}
                  onChange={(e) =>
                    setUnit((u) => ({
                      ...u,
                      safetyContact: e.target?.value,
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
            </SlideOverField>
          ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditUnit;
