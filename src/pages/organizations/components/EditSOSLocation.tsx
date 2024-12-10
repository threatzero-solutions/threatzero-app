import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { CoreContext } from "../../../contexts/core/core-context";
import {
  saveLocation,
  deleteLocation,
  getLocation,
} from "../../../queries/organizations";
import { FieldType, Location, Transient, Unit } from "../../../types/entities";
import { useForm } from "react-hook-form";
import Input from "../../../components/forms/inputs/Input";

interface EditSOSLocationProps {
  setOpen: (open: boolean) => void;
  create: boolean;
  unitId: string;
  locationId?: string;
}

type TransientLocation = Omit<Transient<Location>, "unit" | "locationId"> & {
  unit: Pick<Unit, "id">;
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

  const { data: locationData } = useQuery({
    queryKey: ["location", "id", locationId] as const,
    queryFn: ({ queryKey }) => getLocation(queryKey[2]),
    enabled: !!locationId,
  });

  const data = useMemo(() => {
    const data: TransientLocation = {
      ...(locationData ?? INITIAL_LOCATION),
      unit: locationData?.unit ?? { id: unitId },
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
    save(location);
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
        description={`SOS locations belong to organizational units, and they correlate to
                physical locations within a school, office, etc. Each location
                will have its own QR code and unique link that can be used to submit safety concerns.`}
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
        <SlideOverField
          name="locationId"
          label="Location ID"
          helpText="A unique identifier for tying QR codes and unique links to locations."
        >
          <Input
            type={FieldType.TEXT}
            disabled
            {...register("locationId")}
            placeholder={"Automatically generated"}
            className="w-full"
          />
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditSOSLocation;
