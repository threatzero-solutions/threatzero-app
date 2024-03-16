import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
import ThumbnailCreator from "../../../components/media/ThumbnailCreator";
import FormInput from "../../../components/forms/inputs/FormInput";

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
		order: 3,
	},
	{
		name: "description",
		label: "Description (Optional)",
		type: FieldType.TEXTAREA,
		elementProperties: {
			rows: 3,
		},
		required: false,
		order: 4,
	},
	{
		name: "fileKey",
		label: "File Key",
		helpText: "Location of the resource file.",
		type: FieldType.TEXT,
		required: true,
		order: 5,
	},
	{
		name: "thumbnailKey",
		label: "Thumbnail Key",
		helpText:
			"Location of thumbnail image. Required only if resource type is video.",
		type: FieldType.TEXT,
		required: false,
		order: 6,
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
	const [previewEnabled, setPreviewEnabled] = useState(false);
	const [previewThumbnail, setPreviewThumbnail] = useState<File | undefined>();

	const isNew = useMemo(() => !resourceItemProp, [resourceItemProp]);

	const queryClient = useQueryClient();
	const onMutateSuccess = () => {
		queryClient.invalidateQueries({
			queryKey: ["resource-items", resourceItem.category, resourceItem.type],
		});
		queryClient.invalidateQueries({
			queryKey: ["resource-items-all"],
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
	}, [resourceItemProp]);

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = event.target.value;

		setResourceItem((r) => ({
			...r,
			[event.target.name]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		saveResourceMutation.mutate(resourceItem);
	};

	const handleDelete = () => {
		deleteResourceMutation.mutate(resourceItem.id);
	};

	const downloadThumbnail = () => {
		if (previewThumbnail) {
			const url = URL.createObjectURL(previewThumbnail);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = "thumbnail.png";
			anchor.click();
			URL.revokeObjectURL(url);
		}
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								{isNew ? "Add resource" : "Edit resource"}
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Resources are made available to users to provide helpful
								information.
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
				<div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
					<div className="p-4">
						<p className="mb-2 text-sm font-medium text-gray-900">Preview</p>
						<div className="overflow-hidden rounded-lg bg-gray-50">
							<div className="px-4 py-5 sm:p-6">
								{resourceItem.type === ResourceType.VIDEO ? (
									<ResourceVideoTile
										video={resourceItem as ResourceItem}
										disabled={true}
										previewLocalThumbnailFile={
											previewEnabled ? previewThumbnail : undefined
										}
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
								<FormInput
									field={input}
									onChange={handleChange}
									value={resourceItem[input.name as keyof ResourceItem]}
								/>
								{resourceItem.type === ResourceType.VIDEO &&
									input.name === "thumbnailKey" && (
										<div className="mt-4 pt-4 border-t border-gray-200">
											<p className="text-sm text-gray-500">
												Create Thumbnail From Video
											</p>
											<ThumbnailCreator
												videoSrc={resourceItem.resourceUrl}
												setThumbnail={setPreviewThumbnail}
											/>
											<div className="flex justify-between">
												<label>
													<input
														type="checkbox"
														className="h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
														onChange={(e) =>
															setPreviewEnabled(e.target.checked)
														}
													/>
													<span className="ml-2">Preview</span>
												</label>
												<button
													type="button"
													className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
													onClick={() => downloadThumbnail()}
												>
													Download
												</button>
											</div>
										</div>
									)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
				<div className="flex space-x-3">
					{!isNew && (
						<button
							type="button"
							className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
							onClick={handleDelete}
						>
							Delete
						</button>
					)}
					<div className="grow" />
					<button
						type="button"
						className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
						onClick={() => setOpen(false)}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
					>
						{isNew ? "Add" : "Save"}
					</button>
				</div>
			</div>
		</form>
	);
};

export default EditResource;
