import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Field,
  FieldType,
  InternalFieldType,
  TrainingItem,
  TrainingMetadata,
  Video,
} from "../../../../types/entities";
import { orderSort } from "../../../../utils/core";
import TrainingItemTile from "../TrainingItemTile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingItem,
  getTrainingItem,
  saveTrainingItem,
} from "../../../../queries/training";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { TrainingContext } from "../../../../contexts/training/training-context";
import axios from "axios";
import { API_BASE_URL } from "../../../../contexts/core/constants";
import FormInput from "../../../../components/forms/inputs/FormInput";
import { useDebounceValue } from "usehooks-ts";
import { DraftFunction, useImmer } from "use-immer";
import { EditableItem } from "../../../../types/training";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";

dayjs.extend(duration);

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

const INPUT_DATA: Array<Partial<Field> & { name: keyof Video }> = [
  {
    name: "estCompletionTime",
    label: "Est. Completion Time",
    helpText: "",
    type: FieldType.NUMBER,
    elementProperties: {
      min: 1,
      max: 59,
    },
    required: true,
    order: 1,
  },
  // {
  // 	name: "mediaKeys",
  // 	label: "Video",
  // 	helpText: "",
  // 	type: FieldType.TEXT,
  // 	required: true,
  // 	order: 3,
  // },
  {
    name: "vimeoUrl",
    label: "Vimeo URL",
    helpText: "Add the shared URL from Vimeo.",
    type: FieldType.TEXT,
    required: true,
    order: 4,
  },
  // {
  // 	name: "thumbnailKey",
  // 	label: "Item Thumbnail",
  // 	helpText: "",
  // 	type: FieldType.TEXT,
  // 	required: true,
  // 	order: 4,
  // },
];

interface EditTrainingItemProps {
  setOpen: (open: boolean) => void;
  itemId?: string;
}

type SettableItem = EditableItem & Partial<Record<string, unknown>>;

const EditTrainingItem: React.FC<EditTrainingItemProps> = ({
  setOpen,
  itemId,
}) => {
  // Currently, only videos are supported.
  const [item, setItem] = useImmer<SettableItem>({
    metadata: {
      title: "",
      description: "",
    },
    estCompletionTime: {
      minutes: 1,
    },
  });
  const [debouncedItemToSave] = useDebounceValue(item, 500);
  const autoSaveEnabled = useRef(false);

  const { data: itemProp } = useQuery({
    queryKey: ["training-items", itemId],
    queryFn: ({ queryKey }) => getTrainingItem(queryKey[1]),
    enabled: !!itemId,
  });

  useEffect(() => {
    if (itemProp) {
      setItem({ ...itemProp });
    }
  }, [itemProp, setItem]);

  const { state } = useContext(TrainingContext);

  const isNew = useMemo(() => item.id === undefined, [item.id]);

  const queryClient = useQueryClient();
  const onMutateSuccess = (d?: Partial<Video>) => {
    autoSaveEnabled.current = false;
    queryClient.invalidateQueries({
      predicate: (q) =>
        [
          ["training-items"],
          ["training-items", d?.id],
          ["training-courses", state.activeCourse?.id],
        ].some((k) => q.queryKey.join("").includes(k.join(""))),
    });
  };
  const saveItemMutation = useMutation({
    mutationFn: () => saveTrainingItem(item),
    onSuccess: (d) => {
      setItem((item) => ({ ...item, ...d }));
      onMutateSuccess(d);
    },
  });
  const deleteItemMutation = useMutation({
    mutationFn: deleteTrainingItem,
    onSuccess: () => {
      setOpen(false);
      onMutateSuccess();
    },
  });

  useEffect(() => {
    if (debouncedItemToSave && autoSaveEnabled.current) {
      saveItemMutation.mutate();
    }
  }, [debouncedItemToSave, saveItemMutation.mutate]);

  const handleSetItem = (
    itemUpdate: SettableItem | DraftFunction<SettableItem>
  ) => {
    autoSaveEnabled.current = true;
    setItem(itemUpdate);
  };

  const handleMetadataChange = (
    input: MetadataFieldType,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = typeof event === "string" ? event : event.target.value;

    handleSetItem((i) => {
      i.metadata[input.name] = newValue;
    });
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleSetItem((i) => {
      i[event.target.name] = event.target.value;
    });
  };

  const getEstCompletionTimeInput = (
    input: Partial<Field> & { name: keyof Video }
  ) => (
    <div className="flex rounded-md">
      <FormInput
        field={input}
        value={(item?.estCompletionTime as { minutes: number })?.minutes ?? 1}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          handleSetItem((i) => {
            i.estCompletionTime = {
              minutes: +event.target.value,
            };
          });
        }}
        className={
          "block w-full min-w-0 flex-1 rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
        }
      />
      <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
        minutes
      </span>
    </div>
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveItemMutation.mutate();
  };

  const handleDelete = () => {
    deleteItemMutation.mutate(item.id);
  };

  const cleanupPartialItem = useMutation({
    mutationFn: (input: {
      itemId?: string;
      mediaKeys?: string[];
      thumbnailKey?: string;
    }) =>
      axios.post(`${API_BASE_URL}/api/training/items/cleanup-partial`, input),
  });

  const handleCancel = () => {
    if (isNew) {
      cleanupPartialItem.mutate({
        mediaKeys: item.mediaKeys,
        thumbnailKey: item.thumbnailKey ?? undefined,
      });
    }
    setOpen(false);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={handleCancel}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      closeText={isNew ? "Cancel" : "Close"}
      isSaving={saveItemMutation.isPending}
      lastUpdated={item?.updatedOn}
    >
      <SlideOverHeading
        title={isNew ? "Add new item" : "Edit item"}
        description={"Use the preview below to see the resulting item tile"}
        setOpen={setOpen}
      />

      <SlideOverFormBody>
        {item && (
          <>
            <div className="p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
              <div className="overflow-hidden rounded-lg bg-gray-50">
                <div className="px-4 py-5 sm:p-6">
                  <TrainingItemTile item={item} navigateDisabled={true} />
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
                    item.metadata?.[input.name as keyof TrainingMetadata] ?? ""
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
                {input.name === "estCompletionTime" ? (
                  getEstCompletionTimeInput(input)
                ) : (
                  <FormInput
                    field={input}
                    onChange={handleChange}
                    value={item[input.name as keyof TrainingItem] ?? ""}
                  />
                )}
                {!!input.helpText && (
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {input.helpText}
                  </p>
                )}
              </SlideOverField>
            ))}
          </>
        )}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditTrainingItem;
