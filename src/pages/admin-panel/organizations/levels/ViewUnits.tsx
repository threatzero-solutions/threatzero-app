import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUnits } from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import { Unit } from "../../../../types/entities";
import SlideOver from "../../../../components/layouts/SlideOver";
import EditUnit from "./EditUnit";
import { PageOptions } from "../../../../components/layouts/Paginator";

const DEFAULT_PAGE_SIZE = 10;

export const ViewUnits: React.FC = () => {
	const [unitPageOptions, setUnitPageOptions] = useState<PageOptions>({
		limit: DEFAULT_PAGE_SIZE,
		offset: 0,
	});
	const [editUnitSliderOpen, setEditUnitSliderOpen] = useState(false);
	const [selectedUnit, setSelectedUnit] = useState<Partial<Unit> | undefined>();

	const { data: units } = useQuery({
		queryKey: ["units", unitPageOptions],
		queryFn: ({ queryKey }) => getUnits(queryKey[1] as PageOptions),
	});

	const handleEditUnit = (unit?: Unit) => {
		setSelectedUnit(unit);
		setEditUnitSliderOpen(true);
	};

	return (
		<>
			<DataTable
				data={
					units && {
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
								label: "District",
								key: "institution",
							},
							{
								label: <span className="sr-only">QR Code</span>,
								key: "qrCode",
							},
							{
								label: <span className="sr-only">Edit</span>,
								key: "edit",
								align: "right",
							},
						],
						rows: units.results.map((unit) => ({
							id: unit.id,
							name: unit.name,
							slug: unit.slug,
							institution: unit.organization?.name,
							edit: (
								<button
									type="button"
									className="text-secondary-600 hover:text-secondary-900 font-medium"
									onClick={() => handleEditUnit(unit)}
								>
									Edit
									<span className="sr-only">, {unit.id}</span>
								</button>
							),
						})),
					}
				}
				title="Units"
				subtitle="View, add or edit organizational units (i.e. schools, offices)."
				paginationOptions={
					units && {
						pageParamName: "units_page",
						pageSize: DEFAULT_PAGE_SIZE,
						currentOffset: units.offset,
						total: units.count,
						limit: units.limit,
						setOffset: (offset) =>
							setUnitPageOptions((options) => ({ ...options, offset })),
					}
				}
				notFoundDetail="No units found."
				action={
					<button
						type="button"
						className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
						onClick={() => handleEditUnit()}
					>
						+ Add New Unit
					</button>
				}
			/>
			<SlideOver open={editUnitSliderOpen} setOpen={setEditUnitSliderOpen}>
				<EditUnit setOpen={setEditUnitSliderOpen} unit={selectedUnit} />
			</SlideOver>
		</>
	);
};
