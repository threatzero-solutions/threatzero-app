import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
	TrainingVisibility,
} from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { TrainingContext } from "../../../contexts/training/training-context";
import TrainingSectionTile from "./TrainingSectionTile";
import AddNew from "../../../components/forms/builder/AddNew";
import TrainingItemTile from "./TrainingItemTile";
import ManageItems from "./ManageItems";
import SlideOver from "../../../components/layouts/SlideOver";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	deleteTrainingSection,
	saveTrainingSection,
} from "../../../queries/training";
import dayjs from "dayjs";
import FormInput from "../../../components/forms/inputs/FormInput";

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
		[state.activeSection],
	);

	const sectionsInCourse = useMemo(
		() => state.activeCourse?.sections ?? [],
		[state.activeCourse],
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
				  },
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
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

	const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
		deleteSectionMutation.mutate();
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
			<form className="h-full flex flex-col" onSubmit={handleSubmit}>
				<div className="flex-1">
					{/* Header */}
					<div className="bg-gray-50 px-4 py-6 sm:px-6">
						<div className="flex items-start justify-between space-x-3">
							<div className="space-y-1">
								<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
									{isNew ? "Add" : "Edit"} section
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
					{section && (
						<div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
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
												section.metadata?.[input.name as keyof TrainingMetadata]
											}
											disabled={!section.items || section.items.length < 2}
											title={
												!section.items || section.items.length < 2
													? "Section description and title only appear when a section contains multiple items."
													: undefined
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
										<FormInput
											field={input}
											onChange={handleChange}
											value={
												input.name === "expiresOn" &&
												dayjs(section.expiresOn).isBefore(
													dayjs(section.availableOn),
												)
													? dayjs(section.availableOn)
															.add(1, "day")
															.format("YYYY-MM-DD")
													: section[input.name as keyof TrainingSection]
											}
											min={
												input.name === "expiresOn"
													? dayjs(section.availableOn).format("YYYY-MM-DD")
													: undefined
											}
										/>
									</div>
								</div>
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
						</div>
					)}
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
							disabled={!section?.items || section.items.length < 1}
							className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50 disabled:hover:bg-secondary-600"
						>
							{isNew ? "Add" : "Update"}
						</button>
					</div>
				</div>
			</form>
			<SlideOver open={selectItemsOpen} setOpen={setSelectItemsOpen}>
				<ManageItems setOpen={setSelectItemsOpen} isEditingSection={true} />
			</SlideOver>
		</>
	);
};

export default EditTrainingSection;
