import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
	FormEvent,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { FormsContext } from "../../../contexts/forms/forms-context";
import {
	Field,
	FieldGroup,
	FieldType,
	InternalFieldType,
} from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFieldGroup, saveFieldGroup } from "../../../queries/forms";
import { produce } from "immer";
import FormInput, { FieldOnChangeEventType } from "../inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof FieldGroup }> = [
	{
		name: "title",
		label: "Title",
		helpText: "",
		type: InternalFieldType.HTML,
		elementProperties: {
			height: "6rem",
		},
		required: false,
		order: 1,
	},
	{
		name: "subtitle",
		label: "Subtitle",
		helpText: "",
		type: InternalFieldType.HTML,
		elementProperties: {
			height: "6rem",
		},
		required: false,
		order: 2,
	},
	{
		name: "description",
		label: "Description",
		helpText: "",
		type: InternalFieldType.HTML,
		elementProperties: {
			height: "8rem",
		},
		required: false,
		order: 3,
	},
	{
		name: "order",
		label: "Order",
		helpText: "",
		type: FieldType.NUMBER,
		required: false,
		order: 4,
	},
];

const EditFieldGroup: React.FC = () => {
	const [group, setGroup] = useState<Partial<FieldGroup>>({
		title: "",
		subtitle: "",
		description: "",
		order: undefined,
	});
	const groupDataLoaded = useRef(false);

	const { state: formsState, dispatch: formsDispatch } =
		useContext(FormsContext);

	const setOpen = (open: boolean) =>
		formsDispatch({ type: "SET_EDIT_FIELD_GROUP_SLIDER_OPEN", payload: open });

	const isNew = useMemo(
		() => formsState.activeFieldGroup?.id === undefined,
		[formsState.activeFieldGroup],
	);

	useEffect(() => {
		if (groupDataLoaded.current) {
			return;
		}

		const autoOrder = (
			formsState.activeFieldGroup?.parentGroup?.childGroups ??
			formsState.activeFieldGroup?.form?.groups ??
			[]
		).length;

		setGroup(
			produce((g) => {
				if (formsState.activeFieldGroup) {
					Object.assign(g, formsState.activeFieldGroup);
				}

				if (!Number.isInteger(g.order)) {
					g.order = autoOrder;
				}

				groupDataLoaded.current = true;
			}),
		);
	}, [formsState.activeFieldGroup]);

	const handleChange = (
		input: { name: string },
		event: FieldOnChangeEventType,
	) => {
		const newValue = typeof event === "string" ? event : event.target.value;

		setGroup((g) => ({
			...g,
			[input.name]: newValue,
		}));
	};

	const queryClient = useQueryClient();
	const onMutateSuccess = () => {
		queryClient.invalidateQueries({
			queryKey: [
				"form",
				formsState.activeForm?.slug,
				formsState.activeForm?.id,
			],
		});
		setOpen(false);
	};
	const fieldGroupMutation = useMutation({
		mutationFn: saveFieldGroup,
		onSuccess: () => {
			onMutateSuccess();
		},
	});
	const deleteFieldGroupMutation = useMutation({
		mutationFn: deleteFieldGroup,
		onSuccess: () => {
			onMutateSuccess();
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!group) return;

		const newGroup = {
			...group,
			parentGroup: group.parentGroup && {
				...group.parentGroup,
				childGroups: undefined,
			},
			form: group.form && {
				...group.form,
				groups: undefined,
			},
		} as unknown as FieldGroup;

		fieldGroupMutation.mutate(newGroup);
	};

	const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
		deleteFieldGroupMutation.mutate(group.id);
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								{isNew ? "Add new" : "Edit"} field group
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Edit the title, subtitle, or description for a field group
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
									onChange={(e: FieldOnChangeEventType) =>
										handleChange(input, e)
									}
									value={group[input.name as keyof FieldGroup]}
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
						{isNew ? "Add" : "Update"}
					</button>
				</div>
			</div>
		</form>
	);
};

export default EditFieldGroup;
