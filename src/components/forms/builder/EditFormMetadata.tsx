import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FormEvent, useContext, useEffect, useState } from "react";
import { FormsContext } from "../../../contexts/forms/forms-context";
import { Field, Form, InternalFieldType } from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveForm } from "../../../queries/forms";
import { produce } from "immer";
import FormInput, { FieldOnChangeEventType } from "../inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Form }> = [
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
			height: "6rem",
		},
		required: false,
		order: 3,
	},
];

const EditFormMetadata: React.FC = () => {
	const [form, setForm] = useState<Partial<Form>>({
		title: "",
		subtitle: "",
		description: "",
	});

	const { state: formsState, dispatch: formsDispatch } =
		useContext(FormsContext);

	const setOpen = (open: boolean) =>
		formsDispatch({ type: "SET_METADATA_SLIDER_OPEN", payload: open });

	useEffect(() => {
		setForm(
			produce((f) => {
				if (formsState.activeForm) {
					Object.assign(f, formsState.activeForm);
				}
			}),
		);
	}, [formsState.activeForm]);

	const handleChange = (
		input: { name: string },
		event: FieldOnChangeEventType,
	) => {
		const newValue = typeof event === "string" ? event : event.target.value;

		setForm((f) => ({
			...f,
			[input.name]: newValue,
		}));
	};

	const queryClient = useQueryClient();
	const saveFormMutation = useMutation({
		mutationFn: saveForm,
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["form", data.slug, data.id],
			});
			setOpen(false);
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		saveFormMutation.mutate(form);
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								Edit form metadata
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Metadata includes the title, subtitle, and description
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
									value={form[input.name as keyof Form]}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
				<div className="flex justify-end space-x-3">
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
						Update
					</button>
				</div>
			</div>
		</form>
	);
};

export default EditFormMetadata;
