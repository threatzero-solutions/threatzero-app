import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Field,
  FieldType,
  InternalFieldType,
  TrainingItem,
  TrainingMetadata,
  Video,
} from "../../../../types/entities";
import { classNames, orderSort } from "../../../../utils/core";
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

  const [itemSaving, setItemSaving] = useState(false);

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
    setItemSaving(false);
  };
  const saveItemMutation = useMutation({
    mutationFn: () => {
      setItemSaving(true);
      return saveTrainingItem(item);
    },
    onSuccess: (d) => {
      onMutateSuccess(d);
    },
    onError: () => setItemSaving(false),
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
    <form className="h-full flex flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                {isNew ? "Add" : "Edit"} Item
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Use the preview below to see the resulting section tile
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
        {item && (
          <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
            <div className="p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
              <div className="overflow-hidden rounded-lg bg-gray-50">
                <div className="px-4 py-5 sm:p-6">
                  <TrainingItemTile item={item} navigateDisabled={true} />
                </div>
              </div>
            </div>
            {METADATA_INPUT_DATA.sort(orderSort).map((input) => (
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
                <div className="sm:col-span-2">
                  <FormInput
                    field={input}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleMetadataChange(input, e)
                    }
                    value={
                      item.metadata?.[input.name as keyof TrainingMetadata]
                    }
                  />
                </div>
              </div>
            ))}
            {INPUT_DATA.sort(orderSort).map((input) => (
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
                <div className="sm:col-span-2">
                  {input.name === "estCompletionTime" ? (
                    getEstCompletionTimeInput(input)
                  ) : (
                    <FormInput
                      field={input}
                      onChange={handleChange}
                      value={item[input.name as keyof TrainingItem]}
                    />
                  )}
                  {!!input.helpText && (
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {input.helpText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3 items-center">
          {!isNew && (
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={handleCancel}
          >
            {isNew ? "Cancel" : "Close"}
          </button>
          <div className="grow" />
          {item?.updatedOn && (
            <span
              className={classNames(
                "text-xs italic text-gray-500",
                itemSaving ? "animate-pulse" : ""
              )}
            >
              {itemSaving
                ? "Saving..."
                : `Saved ${dayjs(item.updatedOn).fromNow()}`}
            </span>
          )}
          <button
            type="submit"
            disabled={itemSaving}
            className={classNames(
              "block w-min rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-500/50"
            )}
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditTrainingItem;
