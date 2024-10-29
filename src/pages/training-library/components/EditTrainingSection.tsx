import { useMemo, useState } from "react";
import {
  InternalFieldType,
  TrainingItem,
  TrainingSection,
  TrainingSectionItem,
} from "../../../types/entities";
import TrainingSectionTile from "./TrainingSectionTile";
import AddNew from "../../../components/forms/builder/AddNew";
import TrainingItemTile from "./TrainingItemTile";
import ManageItems from "./ManageItems";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingSection,
  getTrainingSection,
  saveTrainingSection,
} from "../../../queries/training";
import FormInput from "../../../components/forms/inputs/FormInput";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import DurationInput from "../../../components/forms/inputs/DurationInput";
import Input from "../../../components/forms/inputs/Input";
import {
  Controller,
  DeepPartial,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { DurationObject } from "../../../types/api";

const INITIAL_SECTION_STATE: Partial<TrainingSection> = {
  metadata: {
    title: "",
    description: "",
  },
  duration: {
    months: 1,
  },
  items: [],
};

interface EditTrainingSectionProps {
  setOpen: (open: boolean) => void;
  sectionCount?: number;
  courseId?: string;
  sectionId?: TrainingSection["id"];
}

const EditTrainingSection: React.FC<EditTrainingSectionProps> = ({
  setOpen,
  sectionCount,
  courseId,
  sectionId,
}) => {
  const [selectItemsOpen, setSelectItemsOpen] = useState(false);

  const { data: section } = useQuery({
    queryKey: ["training-sections", sectionId] as const,
    queryFn: ({ queryKey }) => getTrainingSection(queryKey[1]),
    enabled: !!sectionId,
  });

  const sectionData = useMemo(() => {
    return {
      ...(section ?? INITIAL_SECTION_STATE),
      order: section?.order ?? sectionCount ?? 0,
    } as DeepPartial<TrainingSection>;
  }, [section, sectionCount]);

  const { register, watch, handleSubmit, control } = useForm({
    values: sectionData,
  });

  const {
    fields: itemFields,
    append: addItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: "items",
    keyName: "keyId",
  });

  const id = watch("id");
  const title = watch("metadata.title");
  const description = watch("metadata.description");
  const items = watch("items");

  const isNew = useMemo(() => !id, [id]);

  const previewSection = useMemo(
    () => ({
      metadata: {
        title: title ?? "",
        description,
      },
      items: (items ?? []) as TrainingSectionItem[],
    }),
    [title, description, items]
  );

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["training-sections", section?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["training-courses", courseId],
    });
    setOpen(false);
  };
  const saveSectionMutation = useMutation({
    mutationFn: (data: DeepPartial<TrainingSection>) =>
      courseId
        ? saveTrainingSection({
            ...data,
            courseId,
          } as TrainingSection)
        : Promise.reject("Failed to save section."),
    onSuccess: onMutateSuccess,
  });
  const deleteSectionMutation = useMutation({
    mutationFn: () => deleteTrainingSection(section?.id),
    onSuccess: onMutateSuccess,
  });

  const handleDelete = () => {
    deleteSectionMutation.mutate();
  };

  const handleSetItemSelection = (selection: DeepPartial<TrainingItem>[]) => {
    for (const item of selection) {
      addItem({ item, order: items?.length ?? 0 });
    }
  };

  const handleAddItems = () => {
    setSelectItemsOpen(true);
  };

  return (
    <>
      <SlideOverForm
        onSubmit={handleSubmit((d) => saveSectionMutation.mutate(d))}
        onClose={() => setOpen(false)}
        hideDelete={isNew}
        onDelete={handleDelete}
        submitText={isNew ? "Add" : "Update"}
        isSaving={saveSectionMutation.isPending}
      >
        <SlideOverHeading
          title={isNew ? "Add section" : "Edit section"}
          description={
            "Use the preview below to see the resulting section tile"
          }
          setOpen={setOpen}
        />
        <SlideOverFormBody>
          <div className="p-4">
            <p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
            <div className="overflow-hidden rounded-lg bg-gray-50">
              <div className="px-4 py-5 sm:p-6">
                <TrainingSectionTile
                  section={previewSection}
                  navigateDisabled={true}
                />
              </div>
            </div>
          </div>

          <SlideOverField label="Title" name="title">
            <FormInput
              {...register("metadata.title")}
              control={control}
              type={InternalFieldType.HTML}
              field={{
                elementProperties: {
                  height: "3rem",
                },
              }}
              required
              disabled={!items || items.length < 2}
              title="Section description and title only appear when a section contains multiple items."
            />
          </SlideOverField>
          <SlideOverField label="Description" name="description">
            <FormInput
              {...register("metadata.description")}
              control={control}
              type={InternalFieldType.HTML}
              field={{
                elementProperties: {
                  height: "6rem",
                },
              }}
              required
              disabled={!items || items.length < 2}
              title="Section description and title only appear when a section contains multiple items."
            />
          </SlideOverField>
          <SlideOverField label="Sequence" name="order">
            <Input {...register("order")} type="number" />
          </SlideOverField>
          <SlideOverField label="Featured For" name="duration">
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <DurationInput
                  value={field.value as DurationObject}
                  onChange={(d) => field.onChange(d)}
                  allowedUnits={["days", "months"]}
                />
              )}
            />
          </SlideOverField>

          {/* SECTION ITEMS */}
          {
            <div className="py-8 px-4 space-y-6 sm:px-6">
              <div className="pb-5 sm:flex sm:items-center sm:justify-between">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Section Items
                </h3>
                <div className="mt-3 flex sm:ml-4 sm:mt-0">
                  {itemFields.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddItems()}
                      className="ml-3 inline-flex items-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                    >
                      + Add Items
                    </button>
                  )}
                </div>
              </div>
              {itemFields.map((field, idx) => (
                <TrainingItemTile
                  key={field.keyId}
                  item={field.item as TrainingItem}
                  className="shadow-lg"
                  dense={true}
                  onRemoveItem={() => removeItem(idx)}
                  navigateDisabled={true}
                />
              ))}

              {itemFields.length === 0 && (
                <AddNew
                  contentName="items"
                  pluralContentName="items"
                  qualifier={null}
                  onAdd={() => handleAddItems()}
                />
              )}
            </div>
          }
        </SlideOverFormBody>
      </SlideOverForm>
      <SlideOver open={selectItemsOpen} setOpen={setSelectItemsOpen}>
        <ManageItems
          setOpen={setSelectItemsOpen}
          isSelecting={true}
          multiple={true}
          excludeSelected={true}
          onConfirmSelection={handleSetItemSelection}
          existingItemSelection={items?.map((i) => i!.item as TrainingItem)}
        />
      </SlideOver>
    </>
  );
};

export default EditTrainingSection;
