import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
	ChangeEvent,
	FormEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Organization, Field, FieldType } from "../../../../types/entities";
import { orderSort, slugify } from "../../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	saveOrganization,
	deleteOrganization,
} from "../../../../queries/organizations";
import FormInput from "../../../../components/forms/inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Organization }> = [
	{
		name: "groupId",
		label: "Group ID",
		helpText:
			"This id correlates with the organization's Group ID in the identity provider.",
		type: FieldType.TEXT,
		elementProperties: {
			disabled: true,
		},
		required: false,
		order: 1,
	},
	{
		name: "slug",
		label: "Slug",
		helpText: "The slug field must be unique.",
		type: FieldType.TEXT,
		required: true,
		order: 2,
	},
	{
		name: "name",
		label: "Name",
		helpText: "A friendly name for the organization.",
		type: FieldType.TEXT,
		required: true,
		order: 3,
	},
	{
		name: "address",
		label: "Address (Optional)",
		type: FieldType.TEXTAREA,
		elementProperties: {
			rows: 3,
		},
		required: false,
		order: 4,
	},
];

interface EditOrganizationProps {
	setOpen: (open: boolean) => void;
	organization?: Partial<Organization>;
}

const EditOrganization: React.FC<EditOrganizationProps> = ({
	setOpen,
	organization: organizationProp,
}) => {
	const [organization, setOrganization] = useState<Partial<Organization>>({});

	const isNew = useMemo(() => !organizationProp, [organizationProp]);

	const slugDebounceTimeout = useRef<number>();

	const queryClient = useQueryClient();
	const onMutateSuccess = () => {
		queryClient.invalidateQueries({
			queryKey: ["organizations"],
		});
		setOpen(false);
	};
	const saveOrganizationMutation = useMutation({
		mutationFn: saveOrganization,
		onSuccess: onMutateSuccess,
	});

	const deleteOrganizationMutation = useMutation({
		mutationFn: deleteOrganization,
		onSuccess: onMutateSuccess,
	});

	useEffect(() => {
		setOrganization((a) => ({
			...a,
			...(organizationProp ?? {}),
		}));
	}, [organizationProp]);

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		let value = event.target.value;
		if (event.target.name === "slug") {
			value = slugify(value, false);

			clearTimeout(slugDebounceTimeout.current);
			slugDebounceTimeout.current = setTimeout(() => {
				setOrganization((a) => ({
					...a,
					slug: slugify(value),
				}));
			}, 1000);
		}

		setOrganization((a) => ({
			...a,
			[event.target.name]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		organization.slug = slugify(organization.slug ?? "");

		saveOrganizationMutation.mutate(organization);
	};

	const handleDelete = () => {
		deleteOrganizationMutation.mutate(organization.id);
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								{isNew ? "Add organization" : "Edit organization"}
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Organizations can be school districts, companies, institutions,
								etc. These correlate to organizations registered in the identity
								provider.
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
									value={organization[input.name as keyof Organization]}
								/>
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

export default EditOrganization;
