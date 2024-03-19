import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DataTable from "../../../components/layouts/DataTable";
import SlideOver from "../../../components/layouts/SlideOver";
import EditResource from "./EditResource";
import { getResourceItems } from "../../../queries/media";
import { ResourceItem } from "../../../types/entities";
import PillBadge from "../../../components/PillBadge";

export const ViewResources: React.FC = () => {
	const [editResourceSliderOpen, setEditResourceSliderOpen] = useState(false);
	const [selectedResource, setSelectedResource] = useState<
		Partial<ResourceItem> | undefined
	>();

	const { data: resources } = useQuery({
		queryKey: ["resource-items-all"],
		queryFn: () => getResourceItems({}),
	});

	const handleEditResource = (resource?: ResourceItem) => {
		setSelectedResource(resource);
		setEditResourceSliderOpen(true);
	};

	return (
		<>
			<DataTable
				data={
					resources && {
						headers: [
							{
								label: "Title",
								key: "title",
							},
							{
								label: "Type",
								key: "type",
							},
							{
								label: "Category",
								key: "category",
							},
							{
								label: <span className="sr-only">Edit</span>,
								key: "edit",
								align: "right",
							},
						],
						rows: resources.results.map((resource) => ({
							id: resource.id,
							title: <div className="flex flex-col gap-2 flex-wrap">
								<span>{resource.title}</span>
								<div className="flex">
								<PillBadge
											color={resource.organizations.length === 0 ? "gray" : "blue"}
											value={""}
											displayValue={
												resource.organizations.length === 0
													? "No organizations"
													: resource.organizations.length > 2
													? `${resource.organizations.length} organizations`
													: resource.organizations[0].name
											}
										/>
										{resource.organizations.length > 0 &&
											resource.organizations.length < 3 &&
											resource.organizations
												.slice(1)
												.map((o) => (
													<PillBadge
														key={o.id}
														color={"blue"}
														value={""}
														displayValue={o.name}
													/>
												))}
								</div>
								</div>,
							type: resource.type,
							category: resource.category,
							edit: (
								<button
									type="button"
									className="text-secondary-600 hover:text-secondary-900 font-medium"
									onClick={() => handleEditResource(resource)}
								>
									Edit
									<span className="sr-only">, {resource.id}</span>
								</button>
							),
						})),
					}
				}
				title="Resources"
				subtitle="View, add or edit resource items."
				notFoundDetail="No resources found."
				action={
					<button
						type="button"
						className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
						onClick={() => handleEditResource()}
					>
						+ Add New Resource
					</button>
				}
			/>
			<SlideOver
				open={editResourceSliderOpen}
				setOpen={setEditResourceSliderOpen}
			>
				<EditResource
					setOpen={setEditResourceSliderOpen}
					resource={selectedResource}
				/>
			</SlideOver>
		</>
	);
};
