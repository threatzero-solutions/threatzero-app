import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Field,
  FieldType,
  InternalFieldType,
  TrainingItem,
  TrainingMetadata,
  TrainingRepeats,
  TrainingSection,
  TrainingSectionItem,
  TrainingVisibility,
} from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { TrainingContext } from "../../../contexts/training/training-context";
import TrainingSectionTile from "./TrainingSectionTile";
import AddNew from "../../../components/forms/builder/AddNew";
import TrainingItemTile from "./TrainingItemTile";
import ManageItems from "./ManageItems";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingSection,
  saveTrainingSection,
} from "../../../queries/training";
import dayjs from "dayjs";
import FormInput from "../../../components/forms/inputs/FormInput";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";

type MetadataFieldType = Partial<Field> & { name: keyof TrainingMetadata };

const METADATA_INPUT_DATA: Array<MetadataFieldType> = [
  {
    name: "title",
    label: "Title",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "3rem",
    },
    required: true,
    order: 1,
  },
  {
    name: "description",
    label: "Description",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 2,
  },
];

const INPUT_DATA: Array<Partial<Field> & { name: keyof TrainingSection }> = [
  {
    name: "availableOn",
    label: "Featured On",
    helpText: "",
    type: FieldType.DATE,
    required: true,
    order: 1,
  },
  {
    name: "expiresOn",
    label: "Featured Until",
    helpText: "",
    type: FieldType.DATE,
    required: false,
    order: 2,
  },
  {
    name: "repeats",
    label: "Repeats",
    helpText: "",
    type: FieldType.SELECT,
    typeParams: {
      options: Object.values(TrainingRepeats).reduce((acc, value) => {
        acc[value] = value;
        return acc;
      }, {} as Record<string, string>),
    },
    required: true,
    order: 3,
  },
];

const EditTrainingSection: React.FC = () => {
  const [selectItemsOpen, setSelectItemsOpen] = useState(false);

  const {
    state,
    dispatch,
    sectionEditing: section,
    setSectionEditing: setSection,
  } = useContext(TrainingContext);

  const setOpen = (open: boolean) =>
    dispatch({ type: "SET_EDIT_SECTION_SLIDER_OPEN", payload: open });

  const isNew = useMemo(
    () => state.activeSection === undefined,
    [state.activeSection]
  );

  const sectionsInCourse = useMemo(
    () => state.activeCourse?.sections ?? [],
    [state.activeCourse]
  );

  useEffect(() => {
    setSection((s) =>
      s
        ? s
        : {
            metadata: {
              title: "",
              description: "",
              visibility: TrainingVisibility.HIDDEN,
            },
            availableOn: new Date().toISOString(),
            expiresOn: null,
            repeats: TrainingRepeats.YEARLY,
            items: [],
          }
    );
  }, [setSection]);

  useEffect(() => {
    const autoOrder = sectionsInCourse.length;

    setSection((s) => {
      if (!state.activeSection || state.activeSection.id === s?.id) {
        return s;
      }

      const newSection = {
        ...(s ?? { metadata: { title: "", description: "" } }),
        ...(state.activeSection ?? {}),
      };

      if (!Number.isInteger(newSection.order)) {
        newSection.order = autoOrder;
      }

      return newSection;
    });

    return () => setSection(undefined);
  }, [setSection, state.activeSection, sectionsInCourse]);

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["training-sections", section?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["training-courses", state.activeCourse?.id],
    });
    setOpen(false);
  };
  const saveSectionMutation = useMutation({
    mutationFn: () =>
      saveTrainingSection({
        ...section,
        courseId: state.activeCourse?.id,
      }),
    onSuccess: onMutateSuccess,
  });
  const deleteSectionMutation = useMutation({
    mutationFn: () => deleteTrainingSection(section?.id),
    onSuccess: onMutateSuccess,
  });

  const handleMetadataChange = (
    input: MetadataFieldType,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = typeof event === "string" ? event : event.target.value;

    setSection((s) => ({
      ...s,
      metadata: {
        ...(s?.metadata ?? {
          title: "",
          description: "",
          visibility: TrainingVisibility.HIDDEN,
        }),
        [input.name]: newValue,
      },
    }));
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = event.target.value;
    if (event.target.type === "date") {
      value = dayjs(value).format();
    }
    setSection((s) => ({
      ...(s ?? {}),
      [event.target.name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    saveSectionMutation.mutate();
  };

  const handleDelete = () => {
    deleteSectionMutation.mutate();
  };

  const handleSetItemSelection = (selection: Partial<TrainingItem>[]) => {
    setSection((s) => {
      const items = [
        ...(s?.items ?? []),
        ...selection.map(
          (i, idx) =>
            ({
              item: i,
              order: idx + (s?.items?.length ?? 0),
            } as TrainingSectionItem)
        ),
      ];

      return {
        ...(s ?? {}),
        items,
      };
    });
  };

  const handleRemoveItem = (item?: Partial<TrainingItem>) => {
    setSection((s) => {
      const items =
        s?.items
          ?.filter((i) => i.item.id !== item?.id)
          .map((i, idx) => ({ ...i, order: idx })) ?? [];

      return {
        ...(s ?? {}),
        items,
      };
    });
  };

  const handleAddItems = () => {
    setSelectItemsOpen(true);
  };

  return (
    <>
      <SlideOverForm
        onSubmit={handleSubmit}
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
          {section && (
            <>
              <div className="p-4">
                <p className="mb-2 text-sm font-medium text-gray-900">
                  Preview
                </p>
                <div className="overflow-hidden rounded-lg bg-gray-50">
                  <div className="px-4 py-5 sm:p-6">
                    <TrainingSectionTile
                      section={section}
                      navigateDisabled={true}
                    />
                  </div>
                </div>
              </div>

              {METADATA_INPUT_DATA.sort(orderSort).map((input) => (
                <SlideOverField
                  key={input.name}
                  label={input.label}
                  name={input.name}
                  helpText={input.helpText}
                >
                  <FormInput
                    field={input}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleMetadataChange(input, e)
                    }
                    value={
                      section.metadata?.[
                        input.name as keyof TrainingMetadata
                      ] ?? ""
                    }
                    disabled={!section.items || section.items.length < 2}
                    title={
                      !section.items || section.items.length < 2
                        ? "Section description and title only appear when a section contains multiple items."
                        : undefined
                    }
                  />
                </SlideOverField>
              ))}
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
                    value={
                      input.name === "expiresOn" &&
                      dayjs(section.expiresOn).isBefore(
                        dayjs(section.availableOn)
                      )
                        ? dayjs(section.availableOn)
                            .add(1, "day")
                            .format("YYYY-MM-DD")
                        : section[input.name as keyof TrainingSection] ?? ""
                    }
                    min={
                      input.name === "expiresOn"
                        ? dayjs(section.availableOn).format("YYYY-MM-DD")
                        : undefined
                    }
                  />
                </SlideOverField>
              ))}

              {/* SECTION ITEMS */}
              {section.items ? (
                <div className="py-8 px-4 space-y-6 sm:px-6">
                  <div className="pb-5 sm:flex sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Section Items
                    </h3>
                    <div className="mt-3 flex sm:ml-4 sm:mt-0">
                      {section.items && section.items.length > 0 && (
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
                  {section.items.sort(orderSort).map((item) => (
                    <TrainingItemTile
                      key={item.id ?? item.item.id}
                      item={item.item}
                      className="shadow-lg"
                      dense={true}
                      onRemoveItem={handleRemoveItem}
                      navigateDisabled={true}
                    />
                  ))}

                  {section.items.length === 0 && (
                    <AddNew
                      contentName="items"
                      pluralContentName="items"
                      qualifier={null}
                      onAdd={() => handleAddItems()}
                    />
                  )}
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </>
          )}
        </SlideOverFormBody>
      </SlideOverForm>
      <SlideOver open={selectItemsOpen} setOpen={setSelectItemsOpen}>
        <ManageItems
          setOpen={setSelectItemsOpen}
          isSelecting={true}
          multiple={true}
          excludeSelected={true}
          onConfirmSelection={handleSetItemSelection}
          existingItemSelection={section?.items?.map((i) => i.item)}
        />
      </SlideOver>
    </>
  );
};

export default EditTrainingSection;
