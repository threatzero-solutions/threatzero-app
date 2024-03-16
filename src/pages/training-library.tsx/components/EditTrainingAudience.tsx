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
import { Audience, Field, FieldType } from "../../../types/entities";
import { orderSort, slugify } from "../../../utils/core";
import { TrainingContext } from "../../../contexts/training/training-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	deleteTrainingAudience,
	saveTrainingAudience,
} from "../../../queries/training";
import FormInput from "../../../components/forms/inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Audience }> = [
	{
		name: "slug",
		label: "Slug",
		helpText: "The slug field must be unique.",
		type: FieldType.TEXT,
		required: true,
		order: 1,
	},
];

interface EditTrainingAudiencesProps {
	setOpen: (open: boolean) => void;
	audience?: Partial<Audience>;
}

const EditTrainingAudiences: React.FC<EditTrainingAudiencesProps> = ({
	setOpen,
	audience: audienceProp,
}) => {
	const [audience, setAudience] = useState<Partial<Audience>>({
		slug: "",
	});

	const { state } = useContext(TrainingContext);

	const isNew = useMemo(() => !audienceProp, [audienceProp]);

	const slugDebounceTimeout = useRef<number>();

	const queryClient = useQueryClient();
	const onMutateSuccess = () => {
		queryClient.invalidateQueries({
			queryKey: ["training-audiences"],
		});
		queryClient.invalidateQueries({
			queryKey: ["training-courses", state.activeCourse?.id],
		});
		setOpen(false);
	};
	const saveAudienceMutation = useMutation({
		mutationFn: saveTrainingAudience,
		onSuccess: onMutateSuccess,
	});

	const deleteAudienceMutation = useMutation({
		mutationFn: deleteTrainingAudience,
		onSuccess: onMutateSuccess,
	});

	useEffect(() => {
		setAudience((a) => ({
			...a,
			...(audienceProp ?? state.activeAudience ?? {}),
		}));
	}, [audienceProp, state.activeAudience]);

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		let value = event.target.value;
		if (event.target.name === "slug") {
			value = slugify(value, false);

			clearTimeout(slugDebounceTimeout.current);
			slugDebounceTimeout.current = setTimeout(() => {
				setAudience((a) => ({
					...a,
					slug: slugify(value),
				}));
			}, 1000);
		}

		setAudience((a) => ({
			...a,
			[event.target.name]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		audience.slug = slugify(audience.slug ?? "");

		saveAudienceMutation.mutate(audience);
	};

	const handleDelete = () => {
		deleteAudienceMutation.mutate(audience.id);
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								{isNew ? "Add audience" : "Edit audience"}
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Audiences determine what group of users training content is
								visible to
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
									value={audience[input.name as keyof Audience]}
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

export default EditTrainingAudiences;
