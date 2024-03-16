import { Combobox } from "@headlessui/react";
import { Organization } from "../../../types/entities";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrganizations } from "../../../queries/organizations";
import { classNames } from "../../../utils/core";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { SimpleChangeEvent } from "../../../types/core";
import PillBadge from "../../PillBadge";

type ConditionalOrganization<M> = M extends true
	? Organization[]
	: Organization | null | undefined;

interface OrganizationSelectProps<M extends boolean | undefined> {
	value: ConditionalOrganization<M>;
	onChange?: (event: SimpleChangeEvent<ConditionalOrganization<M>>) => void;
	name?: string;
	label?: string;
	many?: M;
}

const OrganizationSelect = <M extends boolean | undefined = false>({
	value,
	onChange,
	name,
	label,
	many,
}: OrganizationSelectProps<M>) => {
	const [organizationQuery, setOrganizationQuery] = useState<string>("");

	const organizationQueryDebounce = useRef<number>();

	const { data: organizationData } = useQuery({
		queryKey: ["organizations", organizationQuery],
		queryFn: ({ queryKey }) =>
			getOrganizations({ search: queryKey[1], limit: 5 }),
	});

	const handleQueryOrganization = (event: ChangeEvent<HTMLInputElement>) => {
		clearTimeout(organizationQueryDebounce.current);
		organizationQueryDebounce.current = setTimeout(() => {
			setOrganizationQuery(event.target.value);
		}, 350);
	};

	const organizations = useMemo(() => {
		return organizationData?.results?.filter((org) => {
			if (Array.isArray(value)) {
				return !value.some((o) => o.id === org.id);
			}
			if (value) {
				return value.id !== org.id;
			}
			return true;
		});
	}, [organizationData, value]);

	const handleChange = (organizations: ConditionalOrganization<M>) => {
		if (many && !Array.isArray(organizations) && organizations) {
			handleAddOrganization(organizations);
			return;
		}

		onChange?.({
			type: "change",
			target: {
				name: name ?? "organization",
				value: organizations,
			},
		});
	};

	const handleAddOrganization = (organization: Organization) => {
		if (!many || !Array.isArray(value)) {
			return;
		}
		handleChange([...value, organization] as ConditionalOrganization<M>);
	};

	const handleRemoveOrganization = (organization: Organization) => {
		if (!many || !Array.isArray(value)) {
			return;
		}
		handleChange(
			value.filter(
				(o) => o.id !== organization.id,
			) as ConditionalOrganization<M>,
		);
	};

	return (
		<div>
			<Combobox
				as="div"
				onChange={handleChange}
				value={
					value ?? ((many ? [] : { name: "" }) as ConditionalOrganization<M>)
				}
				className="relative"
			>
				{label && (
					<Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
						{label}
					</Combobox.Label>
				)}
				<div className="relative">
					<Combobox.Input
						className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
						onChange={handleQueryOrganization}
						displayValue={(organization: Organization) =>
							many ? "" : organization?.name
						}
						placeholder="Search for an organization..."
						type="search"
					/>
					{!many && value && (
						<button
							type="button"
							onClick={() => handleChange(null as ConditionalOrganization<M>)}
							className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
						>
							<XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
						</button>
					)}
					{organizations && (
						<Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
							{organizations.length === 0 && (
								<Combobox.Option
									value={null}
									disabled={true}
									className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
								>
									No results
								</Combobox.Option>
							)}
							{organizations.map((organization) => (
								<Combobox.Option
									key={organization?.id ?? -1}
									value={organization}
									className={({ active }) =>
										classNames(
											"relative cursor-default select-none py-2 pl-3 pr-9",
											active ? "bg-secondary-600 text-white" : "text-gray-900",
										)
									}
								>
									<span className="block truncate">
										{organization?.name ?? "Any organization"}
									</span>
								</Combobox.Option>
							))}
						</Combobox.Options>
					)}
				</div>
			</Combobox>
			{many && (
				<div className="flex gap-2 flex-wrap mt-3">
					{Array.isArray(value) && value.length > 0 ? (
						value.map((org) => (
							<PillBadge
								key={org.id}
								value={org}
								displayValue={org.name}
								color="blue"
								isRemovable={true}
								onRemove={() => handleRemoveOrganization(org)}
							/>
						))
					) : (
						<span className="text-sm text-gray-400 italic">
							No organizations selected
						</span>
					)}
				</div>
			)}
		</div>
	);
};

export default OrganizationSelect;
