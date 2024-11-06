import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Audience, Field, FieldType } from "../../../types/entities";
import { orderSort, slugify } from "../../../utils/core";
import { TrainingContext } from "../../../contexts/training/training-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingAudience,
  saveTrainingAudience,
} from "../../../queries/training";
import FormInput from "../../../components/forms/inputs/FormInput";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { useDebounceCallback } from "usehooks-ts";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Audience }> = [
  {
    name: "slug",
    label: "Slug",
    helpText: "The slug field must be unique.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
];

interface EditTrainingAudiencesProps {
  setOpen: (open: boolean) => void;
  audience?: Partial<Audience>;
}

const EditTrainingAudiences: React.FC<EditTrainingAudiencesProps> = ({
  setOpen,
  audience: audienceProp,
}) => {
  const [audience, setAudience] = useState<Partial<Audience>>({
    slug: "",
  });

  const { state } = useContext(TrainingContext);

  const isNew = useMemo(() => !audienceProp, [audienceProp]);

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["training-audiences"],
    });
    queryClient.invalidateQueries({
      queryKey: ["training-course", "id", state.activeCourse?.id],
    });
    setOpen(false);
  };
  const saveAudienceMutation = useMutation({
    mutationFn: saveTrainingAudience,
    onSuccess: onMutateSuccess,
  });

  const deleteAudienceMutation = useMutation({
    mutationFn: deleteTrainingAudience,
    onSuccess: onMutateSuccess,
  });

  useEffect(() => {
    setAudience((a) => ({
      ...a,
      ...(audienceProp ?? state.activeAudience ?? {}),
    }));
  }, [audienceProp, state.activeAudience]);

  const debouncedSetAudience = useDebounceCallback(setAudience, 1000);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    if (event.target.name === "slug") {
      debouncedSetAudience((a) => ({
        ...a,
        slug: slugify(slugify(value, false)),
      }));
    }

    setAudience((a) => ({
      ...a,
      [event.target.name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    audience.slug = slugify(audience.slug ?? "");

    saveAudienceMutation.mutate(audience);
  };

  const handleDelete = () => {
    deleteAudienceMutation.mutate(audience.id);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={saveAudienceMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add audience" : "Edit audience"}
        description={`Audiences determine what group of users training content is
								visible to`}
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
            <FormInput
              field={input}
              onChange={handleChange}
              value={audience[input.name as keyof Audience]}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditTrainingAudiences;
