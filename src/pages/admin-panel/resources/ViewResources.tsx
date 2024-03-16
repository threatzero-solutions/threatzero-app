import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DataTable from "../../../components/layouts/DataTable";
import SlideOver from "../../../components/layouts/SlideOver";
import EditResource from "./EditResource";
import { getResourceItems } from "../../../queries/media";
import { ResourceItem } from "../../../types/entities";

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
							title: resource.title,
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
