import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";
import { SimpleChangeEvent } from "../../../types/core";

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
		name: "organizations",
		label: "Organizations",
		helpText: "The organizations that can access this resource.",
		type: FieldType.SELECT,
		required: true,
		order: 3,
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
		event: SimpleChangeEvent<unknown>,
	) => {
		setResourceItem((r) => event.target ? {
			...r,
			[event.target.name]: event.target.value,
		} : r);
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
					{INPUT_DATA.sort(orderSort).filter(
						(i) => resourceItem.type === ResourceType.VIDEO && i.name !== "fileKey" || resourceItem.type === ResourceType.DOCUMENT && i.name !== "vimeoUrl"
					).map((input) => (
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
								{input.name === "organizations" ? (
									<OrganizationSelect
										value={resourceItem.organizations ?? []}
										name="organizations"
										onChange={handleChange}
										many />
								) : (

								<FormInput
									field={input}
									onChange={handleChange}
									value={resourceItem[input.name as keyof ResourceItem]}
								/>
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
