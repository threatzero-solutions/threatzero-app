import { useCallback, useContext, useMemo, useState } from "react";
import { Unit, FieldType } from "../../../../types/entities";
import { slugify } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveUnit,
  deleteUnit,
  saveLocation,
  getUnit,
} from "../../../../queries/organizations";
import OrganizationSelect from "../../../../components/forms/inputs/OrganizationSelect";
import SafetyContactInput from "../../../../components/safety-management/SafetyContactInput";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import { CoreContext } from "../../../../contexts/core/core-context";
import { Controller, useForm } from "react-hook-form";
import Checkbox from "../../../../components/forms/inputs/Checkbox";
import Input from "../../../../components/forms/inputs/Input";
import TextArea from "../../../../components/forms/inputs/TextArea";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useAutoSlug } from "../../../../hooks/use-auto-slug";

interface EditUnitProps {
  setOpen: (open: boolean) => void;
  unit?: Partial<Unit>;
}

const INITIAL_UNIT: Partial<Unit> = {
  name: "",
  slug: "",
};

const EditUnit: React.FC<EditUnitProps> = ({ setOpen, unit: unitProp }) => {
  const { data: unitData } = useQuery({
    queryKey: ["unit", "id", unitProp?.id] as const,
    queryFn: ({ queryKey }) => getUnit(queryKey[2]),
    enabled: !!unitProp?.id,
  });

  const [autoAddLocation, setAutoAddLocation] = useState(false);

  const isNew = useMemo(() => !unitProp, [unitProp]);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const formMethods = useForm({
    values: unitData ?? INITIAL_UNIT,
  });

  const { register, handleSubmit, watch, control } = formMethods;

  const id = watch("id");
  const name = watch("name");

  const { registerSlug, resetSlug } = useAutoSlug({
    ...formMethods,
    defaultSlug: unitData?.slug,
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
    },
  });

  const saveUnitMutation = useMutation({
    mutationFn: saveUnit,
    onSuccess: (newUnit) => {
      if (autoAddLocation) {
        saveLocationMutation.mutate({
          name: newUnit.name,
          unit: {
            id: newUnit.id,
          },
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["units"],
      });
      queryClient.invalidateQueries({
        queryKey: ["unit", "id", newUnit.id],
      });
      setOpen(false);
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["units"],
      });
      setOpen(false);
      setConfirmationClose();
    },
    onError: () => {
      setConfirmationClose();
    },
  });

  const handleSave = (unit: Partial<Unit>) => {
    saveUnitMutation.mutate({
      ...unit,
      slug: slugify(unit.slug ?? ""),
    });
  };

  const handleDelete = useCallback(() => {
    setConfirmationOpen({
      title: `Delete ${name} Unit`,
      message: `Are you sure you want to delete this unit?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteUnitMutation.mutate(id);
      },
      destructive: true,
      confirmText: "Delete",
    });
  }, [name, id, deleteUnitMutation, setConfirmationOpen]);

  return (
    <SlideOverForm
      onSubmit={handleSubmit(handleSave)}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={saveUnitMutation.isPending}
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
        <SlideOverField
          key="organization"
          label="Organization"
          helpText="The organization this unit belongs to."
        >
          <Controller
            name="organization"
            control={control}
            render={({ field }) => (
              <OrganizationSelect
                value={field.value}
                onChange={(e) => field.onChange(e.target?.value)}
              />
            )}
          />
        </SlideOverField>
        <SlideOverField
          name="name"
          label="Name"
          helpText="A friendly name for this unit."
        >
          <Input
            type={FieldType.TEXT}
            required
            {...register("name")}
            className="w-full"
          />
        </SlideOverField>
        <SlideOverField
          name="slug"
          label="Slug"
          helpText="The slug field must be unique."
        >
          <div className="relative">
            <Input
              type={FieldType.TEXT}
              required
              {...registerSlug()}
              className="w-full pr-7"
            />
            <button
              type="button"
              className="group absolute right-2 top-1/2 -translate-y-1/2 disabled:opacity-50"
              title="Generate slug from name"
              onClick={() => resetSlug()}
              disabled={!name}
            >
              <ArrowPathIcon className="size-4 group-hover:group-enabled:rotate-180 duration-500 transition-transform" />
            </button>
          </div>
        </SlideOverField>
        <SlideOverField name="address" label="Address (Optional)">
          <TextArea {...register("address")} rows={3} className="w-full" />
        </SlideOverField>
        <SlideOverField key="safetyContact" label="Safety Contact">
          <Controller
            name="safetyContact"
            control={control}
            render={({ field }) => (
              <SafetyContactInput
                value={field.value}
                onChange={(e) => field.onChange(e.target?.value)}
              />
            )}
          />
        </SlideOverField>
        <SlideOverField
          name="autoAddLocation"
          label="Automatically Add Location"
        >
          <Checkbox
            onChange={(checked) => setAutoAddLocation(checked)}
            checked={autoAddLocation}
          />
        </SlideOverField>
        <SlideOverField
          name="groupId"
          label="Group ID"
          helpText="This id correlates with the unit's Group ID in the identity provider."
        >
          <Input
            type={FieldType.TEXT}
            disabled
            {...register("groupId", {
              disabled: true,
            })}
            placeholder="Automatically generated"
            className="w-full"
          />
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditUnit;
