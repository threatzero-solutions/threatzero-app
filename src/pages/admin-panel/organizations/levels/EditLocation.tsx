import { Combobox, Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
	ChangeEvent,
	FormEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Location, Field, FieldType, Unit } from "../../../../types/entities";
import { classNames, orderSort } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	saveLocation,
	deleteLocation,
	getUnits,
} from "../../../../queries/organizations";
import FormInput from "../../../../components/forms/inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Location }> = [
	{
		name: "unit",
		label: "Unit",
		helpText: "This location's unit.",
		type: FieldType.SELECT,
		required: true,
		order: 1,
	},
	{
		name: "name",
		label: "Name",
		helpText: "A friendly name for the location.",
		type: FieldType.TEXT,
		required: true,
		order: 2,
	},
	{
		name: "locationId",
		label: "Location ID",
		type: FieldType.TEXT,
		placeholder: "Automatically generated",
		elementProperties: {
			disabled: true,
		},
		required: false,
		order: 3,
	},
];

interface EditLocationProps {
	setOpen: (open: boolean) => void;
	location?: Partial<Location>;
}

const EditLocation: React.FC<EditLocationProps> = ({
	setOpen,
	location: locationProp,
}) => {
	const [location, setLocation] = useState<Partial<Location>>({});
	const [unitQuery, setUnitQuery] = useState<string>("");

	const isNew = useMemo(() => !locationProp, [locationProp]);

	const unitQueryDebounce = useRef<number>();

	const { data: units } = useQuery({
		queryKey: ["units", unitQuery],
		queryFn: ({ queryKey }) => getUnits({ search: queryKey[1], limit: 5 }),
	});

	const queryClient = useQueryClient();
	const onMutateSuccess = () => {
		queryClient.invalidateQueries({
			queryKey: ["locations"],
		});
		setOpen(false);
	};
	const saveLocationMutation = useMutation({
		mutationFn: saveLocation,
		onSuccess: onMutateSuccess,
	});

	const deleteLocationMutation = useMutation({
		mutationFn: deleteLocation,
		onSuccess: onMutateSuccess,
	});

	useEffect(() => {
		setLocation((a) => ({
			...a,
			...(locationProp ?? {}),
		}));
	}, [locationProp]);

	const handleQueryUnit = (event: ChangeEvent<HTMLInputElement>) => {
		clearTimeout(unitQueryDebounce.current);
		unitQueryDebounce.current = setTimeout(() => {
			setUnitQuery(event.target.value);
		}, 350);
	};

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = event.target.value;

		setLocation((a) => ({
			...a,
			[event.target.name]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		saveLocationMutation.mutate(location);
	};

	const handleDelete = () => {
		deleteLocationMutation.mutate(location.id);
	};

	return (
		<form className="flex h-full flex-col" onSubmit={handleSubmit}>
			<div className="flex-1">
				{/* Header */}
				<div className="bg-gray-50 px-4 py-6 sm:px-6">
					<div className="flex items-start justify-between space-x-3">
						<div className="space-y-1">
							<Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
								{isNew ? "Add location" : "Edit location"}
							</Dialog.Title>
							<p className="text-sm text-gray-500">
								Locations belong to organizational units, and they correlate to
								physical locations such as a building.
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
								{input.name === "unit" ? (
									<Combobox
										as="div"
										value={location.unit ?? ({} as Unit)}
										onChange={(v) => setLocation((l) => ({ ...l, unit: v }))}
										className="relative"
									>
										<Combobox.Input
											className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
											onChange={handleQueryUnit}
											displayValue={(unit: Unit) => unit?.name}
											type="search"
											placeholder="Search for a unit..."
										/>
										{!!units?.results && units.results.length > 0 && (
											<Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
												{units?.results.map((unit) => (
													<Combobox.Option
														key={unit.id}
														value={unit}
														className={({ active }) =>
															classNames(
																"relative cursor-default select-none py-2 pl-3 pr-9",
																active
																	? "bg-secondary-600 text-white"
																	: "text-gray-900",
															)
														}
													>
														<span className="block truncate">{unit.name}</span>
													</Combobox.Option>
												))}
											</Combobox.Options>
										)}
									</Combobox>
								) : (
									<FormInput
										field={input}
										onChange={handleChange}
										value={location[input.name as keyof Location]}
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

export default EditLocation;
