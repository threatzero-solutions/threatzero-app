import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getOrganizations } from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import SlideOver from "../../../../components/layouts/SlideOver";
import EditOrganization from "./EditOrganization";
import { Organization } from "../../../../types/entities";
import { PageOptions } from "../../../../components/layouts/Paginator";

const DEFAULT_PAGE_SIZE = 10;

export const ViewOrganizations: React.FC = () => {
	const [organizationPageOptions, setOrganizationPageOptions] =
		useState<PageOptions>({
			limit: DEFAULT_PAGE_SIZE,
			offset: 0,
		});
	const [editOrganizationSliderOpen, setEditOrganizationSliderOpen] =
		useState(false);
	const [selectedOrganization, setSelectedOrganization] = useState<
		Partial<Organization> | undefined
	>();

	const { data: institutions } = useQuery({
		queryKey: ["organizations", organizationPageOptions],
		queryFn: ({ queryKey }) => getOrganizations(queryKey[1] as PageOptions),
	});

	const handleEditOrganization = (organization?: Organization) => {
		setSelectedOrganization(organization);
		setEditOrganizationSliderOpen(true);
	};

	return (
		<>
			<DataTable
				data={
					institutions && {
						headers: [
							{
								label: "Name",
								key: "name",
							},
							{
								label: "Slug",
								key: "slug",
							},
							{
								label: <span className="sr-only">Edit</span>,
								key: "edit",
								align: "right",
							},
						],
						rows: institutions.results.map((organization) => ({
							id: organization.id,
							name: organization.name,
							slug: organization.slug,
							edit: (
								<button
									type="button"
									className="text-secondary-600 hover:text-secondary-900 font-medium"
									onClick={() => handleEditOrganization(organization)}
								>
									Edit
									<span className="sr-only">, {organization.id}</span>
								</button>
							),
						})),
					}
				}
				title="Organizations"
				subtitle="View, add or edit top-level organizations (i.e. school districts, companies)."
				paginationOptions={
					institutions && {
						pageParamName: "organizations_page",
						pageSize: DEFAULT_PAGE_SIZE,
						currentOffset: institutions.offset,
						total: institutions.count,
						limit: institutions.limit,
						setOffset: (offset) =>
							setOrganizationPageOptions((options) => ({ ...options, offset })),
					}
				}
				notFoundDetail="No organizations found."
				action={
					<button
						type="button"
						className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
						onClick={() => handleEditOrganization()}
					>
						+ Add New Organization
					</button>
				}
			/>
			<SlideOver
				open={editOrganizationSliderOpen}
				setOpen={setEditOrganizationSliderOpen}
			>
				<EditOrganization
					setOpen={setEditOrganizationSliderOpen}
					organization={selectedOrganization}
				/>
			</SlideOver>
		</>
	);
};
