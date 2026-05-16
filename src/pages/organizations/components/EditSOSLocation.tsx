import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { Controller } from "react-hook-form";
import Input from "../../../components/forms/inputs/Input";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { CoreContext } from "../../../contexts/core/core-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  saveLocation,
  deleteLocation,
  getLocation,
} from "../../../queries/organizations";
import { FieldType, Location, Transient, Unit } from "../../../types/entities";
import { useForm } from "react-hook-form";

interface EditSOSLocationProps {
  setOpen: (open: boolean) => void;
  create: boolean;
  /**
   * When set, the slide-over locks the unit to this id and hides the picker.
   * Used today only by callers that pass a fixed unit context. The org-level
   * Locations page leaves this undefined so the operator can choose a unit
   * or leave it empty for an organization-wide location.
   */
  unitId?: string;
  locationId?: string;
}

// `organization` is server-derived from the caller's tenant context, so we
// omit it here. `unit` is optional — null means org-wide routing.
type TransientLocation = Omit<
  Transient<Location>,
  "organization" | "unit" | "locationId"
> & {
  unit: Pick<Unit, "id"> | null;
  locationId?: string;
};

const INITIAL_LOCATION: Omit<TransientLocation, "unit"> = {
  name: "",
};

const EditSOSLocation: React.FC<EditSOSLocationProps> = ({
  setOpen,
  create,
  unitId,
  locationId,
}) => {
  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);
  const { currentOrganization } = useContext(OrganizationsContext);

  const { data: locationData } = useQuery({
    queryKey: ["location", "id", locationId] as const,
    queryFn: ({ queryKey }) => getLocation(queryKey[2]),
    enabled: !!locationId,
  });

  const data = useMemo(() => {
    const data: TransientLocation = {
      ...(locationData ?? INITIAL_LOCATION),
      unit: locationData?.unit ?? (unitId ? { id: unitId } : null),
    };
    return data;
  }, [locationData, unitId]);

  const formMethods = useForm({
    values: data,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { isDirty },
  } = formMethods;

  const id = watch("id");
  const name = watch("name");

  const queryClient = useQueryClient();
  const { mutate: save, isPending } = useMutation({
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

  const { mutate: doDelete } = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
      setOpen(false);
      setConfirmationClose();
    },
  });

  const handleSave = (location: TransientLocation) => {
    // System admins in admin-panel context don't carry a tenant org on the
    // request, so the API can't infer the target org. Sending it explicitly
    // is also a no-op for tenant users (the API trusts CLS over the dto).
    save(
      currentOrganization
        ? { ...location, organization: { id: currentOrganization.id } }
        : location,
    );
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${name} Location`,
      message: (
        <span>
          Are you sure you want to delete this location? This action cannot be
          undone.
          <br />
          <br />
          <strong>
            All QR codes and links associated with this location will no longer
            work.
          </strong>
        </span>
      ),
      onConfirm: () => {
        doDelete(id);
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

  const unitLocked = !!unitId;

  return (
    <SlideOverForm
      onSubmit={handleSubmit(handleSave)}
      onClose={() => setOpen(false)}
      hideDelete={create}
      onDelete={handleDelete}
      submitText={create ? "Add" : "Update"}
      isSaving={isPending}
      submitDisabled={!isDirty}
    >
      <SlideOverHeading
        title={create ? "Add SOS location" : "Edit SOS location"}
        description={
          unitLocked
            ? "SOS locations correlate to physical spots within a school, office, etc. Each location has its own QR code and unique link that can be used to submit safety concerns. Reports from this location route to the unit's TAT."
            : "SOS locations correlate to physical spots within a school, office, etc. Each location has its own QR code and unique link that can be used to submit safety concerns. Tie a location to a unit to route reports to that unit's TAT, or leave it organization-wide."
        }
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <SlideOverField
          name="name"
          label="Name"
          helpText={`A friendly name for this SOS location.`}
        >
          <Input
            type={FieldType.TEXT}
            required
            {...register("name")}
            className="w-full"
          />
        </SlideOverField>
        {!unitLocked && (
          <SlideOverField
            name="unit"
            label="Unit (optional)"
            helpText="Leave empty to route reports to the organization's TAT. Pick a unit to route reports to that unit's TAT instead."
          >
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <UnitSelect
                  value={field.value as Unit | null | undefined}
                  onChange={(e) => field.onChange(e?.target?.value ?? null)}
                  name={field.name}
                />
              )}
            />
          </SlideOverField>
        )}
        {!create && (
          <SlideOverField
            name="locationId"
            label="Location ID"
            helpText="A unique identifier for tying QR codes and unique links to locations."
          >
            <Input
              type={FieldType.TEXT}
              disabled
              {...register("locationId")}
              className="w-full"
            />
          </SlideOverField>
        )}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditSOSLocation;
