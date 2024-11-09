import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Field,
  FieldType,
  ResourceItem,
  ResourceType,
  ResourceItemCategory,
} from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteResourceItem, saveResourceItem } from "../../../queries/media";
import { ResourceVideoTile } from "../../../components/resources/ResourceVideos";
import { ResourceDocumentTile } from "../../../components/resources/ResourceDocuments";
import FormInput from "../../../components/forms/inputs/FormInput";
import { SimpleChangeEvent } from "../../../types/core";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";

const INPUT_DATA: Array<Partial<Field> & { name: keyof ResourceItem }> = [
  {
    name: "type",
    label: "Type",
    helpText: "The resource type.",
    type: FieldType.SELECT,
    required: true,
    typeParams: {
      options: {
        [ResourceType.VIDEO]: "Video",
        [ResourceType.DOCUMENT]: "Document",
      },
    },
    order: 1,
  },
  {
    name: "category",
    label: "Category",
    helpText: "The category the resource will be separated into.",
    type: FieldType.SELECT,
    typeParams: {
      options: {
        prevention: "Prevention",
        preparation: "Preparation",
        response: "Response",
        resilience: "Resilience",
      } as Record<ResourceItemCategory, string>,
    },
    required: true,
    order: 2,
  },
  {
    name: "title",
    label: "Title",
    helpText: "The title displayed for this resource.",
    type: FieldType.TEXT,
    required: true,
    order: 4,
  },
  {
    name: "description",
    label: "Description (Optional)",
    type: FieldType.TEXTAREA,
    elementProperties: {
      rows: 3,
    },
    required: false,
    order: 5,
  },
  {
    name: "vimeoUrl",
    label: "Vimeo URL",
    helpText: "Video URL from Vimeo.",
    type: FieldType.TEXT,
    required: true,
    order: 6,
  },
  {
    name: "fileKey",
    label: "Resource File Key",
    helpText: "S3 key of the resource.",
    type: FieldType.TEXT,
    required: true,
    order: 7,
  },
];

interface EditResourceProps {
  setOpen: (open: boolean) => void;
  resource?: Partial<ResourceItem>;
}

const EditResource: React.FC<EditResourceProps> = ({
  setOpen,
  resource: resourceItemProp,
}) => {
  const [resourceItem, setResourceItem] = useState<Partial<ResourceItem>>({});

  const isNew = useMemo(() => !resourceItemProp, [resourceItemProp]);

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[1] !== null &&
        typeof q.queryKey[1] === "object" &&
        (q.queryKey[1] as Record<string, string>).category ===
          resourceItem.category &&
        (q.queryKey[1] as Record<string, string>).type === resourceItem.type,
    });
    setOpen(false);
  };
  const saveResourceMutation = useMutation({
    mutationFn: saveResourceItem,
    onSuccess: onMutateSuccess,
  });

  const deleteResourceMutation = useMutation({
    mutationFn: deleteResourceItem,
    onSuccess: onMutateSuccess,
  });

  useEffect(() => {
    setResourceItem((r) => ({
      ...r,
      ...(resourceItemProp ?? {}),
    }));

    return () => setResourceItem({});
  }, [resourceItemProp]);

  const handleChange = (event: SimpleChangeEvent<unknown>) => {
    setResourceItem((r) =>
      event.target
        ? {
            ...r,
            [event.target.name]: event.target.value,
          }
        : r
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    saveResourceMutation.mutate(resourceItem);
  };

  const handleDelete = () => {
    deleteResourceMutation.mutate(resourceItem.id);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={saveResourceMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add resource" : "Edit resource"}
        description={`Resources are made available to users to provide helpful
                information.`}
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
          <div className="overflow-hidden rounded-lg bg-gray-50">
            <div className="px-4 py-5 sm:p-6">
              {resourceItem.type === ResourceType.VIDEO ? (
                <ResourceVideoTile
                  video={resourceItem as ResourceItem}
                  disabled={true}
                />
              ) : (
                <ResourceDocumentTile
                  document={resourceItem as ResourceItem}
                  disabled={true}
                />
              )}
            </div>
          </div>
        </div>
        {INPUT_DATA.sort(orderSort)
          .filter(
            (i) =>
              !["vimeoUrl", "fileKey"].includes(i.name) ||
              (i.name === "vimeoUrl" &&
                resourceItem.type === ResourceType.VIDEO) ||
              (i.name === "fileKey" &&
                resourceItem.type === ResourceType.DOCUMENT)
          )
          .map((input) => (
            <SlideOverField
              key={input.name}
              label={input.label}
              name={input.name}
              helpText={input.helpText}
            >
              <FormInput
                field={input}
                onChange={handleChange}
                value={resourceItem[input.name as keyof ResourceItem] ?? ""}
              />
            </SlideOverField>
          ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditResource;
