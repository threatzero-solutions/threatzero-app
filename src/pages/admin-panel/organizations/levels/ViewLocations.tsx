import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	generateQrCode,
	getLocations,
} from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import SlideOver from "../../../../components/layouts/SlideOver";
import EditLocation from "./EditLocation";
import { Location } from "../../../../types/entities";
import { Link } from "react-router-dom";
import { PageOptions } from "../../../../components/layouts/Paginator";

const DEFAULT_PAGE_SIZE = 10;

export const ViewLocations: React.FC = () => {
	const [locationPageOptions, setLocationPageOptions] = useState<PageOptions>({
		limit: DEFAULT_PAGE_SIZE,
		offset: 0,
	});
	const [editLocationSliderOpen, setEditLocationSliderOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<
		Partial<Location> | undefined
	>();

	const { data: locations } = useQuery({
		queryKey: ["locations", locationPageOptions],
		queryFn: ({ queryKey }) => getLocations(queryKey[1] as PageOptions),
	});

	const handleEditLocation = (location?: Location) => {
		setSelectedLocation(location);
		setEditLocationSliderOpen(true);
	};

	const handleDownloadQRCode = (locationId: string) => {
		generateQrCode(locationId).then((imgData) => {
			const a = document.createElement("a");
			a.href = URL.createObjectURL(imgData);
			a.download = `sos-qr-code-${locationId}.png`;
			a.click();
		});
	};

	return (
		<>
			<DataTable
				data={
					locations && {
						headers: [
							{
								label: "Name",
								key: "name",
							},
							{
								label: "Location ID",
								key: "locationId",
							},
							{
								label: "Unit",
								key: "unit",
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
						rows: locations.results.map((location) => ({
							id: location.id,
							name: location.name,
							locationId: location.locationId,
							unit: location.unit.name,
							qrCode: (
								<span>
									<Link
										to={`/sos/?loc_id=${location.locationId}`}
										className="text-secondary-600 hover:text-secondary-900 font-medium"
									>
										SOS Link
									</Link>
									<span> / </span>
									<button
										type="button"
										className="text-secondary-600 hover:text-secondary-900 font-medium"
										onClick={() => handleDownloadQRCode(location.locationId)}
									>
										QR Code
									</button>
								</span>
							),
							edit: (
								<button
									type="button"
									className="text-secondary-600 hover:text-secondary-900 font-medium"
									onClick={() => handleEditLocation(location)}
								>
									Edit
									<span className="sr-only">, {location.id}</span>
								</button>
							),
						})),
					}
				}
				title="Locations"
				subtitle="View, add or edit specific locations that belong to an organizational unit."
				paginationOptions={
					locations && {
						pageParamName: "locations_page",
						pageSize: DEFAULT_PAGE_SIZE,
						currentOffset: locations.offset,
						total: locations.count,
						limit: locations.limit,
						setOffset: (offset) =>
							setLocationPageOptions((options) => ({ ...options, offset })),
					}
				}
				notFoundDetail="No locations found."
				action={
					<button
						type="button"
						className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
						onClick={() => handleEditLocation()}
					>
						+ Add New Location
					</button>
				}
			/>
			<SlideOver
				open={editLocationSliderOpen}
				setOpen={setEditLocationSliderOpen}
			>
				<EditLocation
					setOpen={setEditLocationSliderOpen}
					location={selectedLocation}
				/>
			</SlideOver>
		</>
	);
};
