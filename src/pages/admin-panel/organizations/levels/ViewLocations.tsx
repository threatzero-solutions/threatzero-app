import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  generateQrCode,
  getLocations,
} from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditLocation from "./EditLocation";
import { Location } from "../../../../types/entities";
import { Link } from "react-router-dom";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";

export const ViewLocations: React.FC = () => {
  const [editLocationSliderOpen, setEditLocationSliderOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    Partial<Location> | undefined
  >();

  const [locationsQuery, setLocationsQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );
  const [debouncedLocationsQuery] = useDebounceValue(locationsQuery, 500);

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", debouncedLocationsQuery] as const,
    queryFn: ({ queryKey }) => getLocations(queryKey[1]),
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
        data={{
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
              key: "unit.name",
            },
            {
              label: <span className="sr-only">QR Code</span>,
              key: "qrCode",
              noSort: true,
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
              noSort: true,
            },
          ],
          rows: (locations?.results ?? []).map((location) => ({
            id: location.id,
            name: location.name,
            locationId: location.locationId,
            ["unit.name"]: location.unit.name,
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
        }}
        isLoading={locationsLoading}
        title="Locations"
        subtitle="View, add or edit specific locations that belong to an organizational unit."
        orderOptions={{
          order: locationsQuery.order,
          setOrder: (k, v) => {
            setLocationsQuery((q) => {
              q.order = { [k]: v };
              q.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: locations?.offset,
          total: locations?.count,
          limit: locations?.limit,
          setOffset: (offset) =>
            setLocationsQuery((q) => {
              q.offset = offset;
            }),
        }}
        searchOptions={{
          searchQuery: locationsQuery.search ?? "",
          setSearchQuery: (search) => {
            setLocationsQuery((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
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
