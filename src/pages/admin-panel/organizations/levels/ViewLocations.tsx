import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useState } from "react";
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
import { useOrganizationFilters } from "../../../../hooks/use-organization-filters";
import {
  LinkIcon,
  PencilSquareIcon,
  QrCodeIcon,
} from "@heroicons/react/20/solid";
import ButtonGroup from "../../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../../components/layouts/buttons/IconButton";
import { simulateDownload } from "../../../../utils/core";
import { AlertContext } from "../../../../contexts/alert/alert-context";

export const ViewLocations: React.FC = () => {
  const { setInfo } = useContext(AlertContext);

  const [editLocationSliderOpen, setEditLocationSliderOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    Partial<Location> | undefined
  >();

  const [locationsQuery, setLocationsQuery] = useImmer<ItemFilterQueryParams>({
    order: { ["unit.name"]: "ASC", name: "ASC" },
  });
  const [debouncedLocationsQuery] = useDebounceValue(locationsQuery, 500);

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", debouncedLocationsQuery] as const,
    queryFn: ({ queryKey }) => getLocations(queryKey[1]),
  });

  const organizationFilters = useOrganizationFilters({
    query: locationsQuery,
    setQuery: setLocationsQuery,
    organizationKey: "unit.organization.slug",
    unitKey: "unit.slug",
  });

  const handleEditLocation = (location?: Location) => {
    setSelectedLocation(location);
    setEditLocationSliderOpen(true);
  };

  const downloadQrCodeMutation = useMutation({
    mutationFn: generateQrCode,
    onSuccess: ({ locationId, data }) => {
      simulateDownload(data, `sos-qr-code-${locationId}.png`);

      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const handleDownloadQRCode = (locationId: string) => {
    setInfo("Downloading QR code...");
    downloadQrCodeMutation.mutate(locationId);
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
              label: <span className="sr-only">Actions</span>,
              key: "actions",
              align: "right",
              noSort: true,
            },
          ],
          rows: (locations?.results ?? []).map((location) => ({
            id: location.id,
            name: location.name,
            locationId: location.locationId,
            ["unit.name"]: location.unit.name,
            actions: (
              <ButtonGroup className="w-full justify-end">
                <IconButton
                  as={Link}
                  icon={LinkIcon}
                  to={`/sos/?loc_id=${location.locationId}`}
                  target="_blank"
                  className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
                  text="SOS Link"
                />
                <IconButton
                  icon={QrCodeIcon}
                  className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
                  text="QR Code"
                  type="button"
                  onClick={() => handleDownloadQRCode(location.locationId)}
                />
                <IconButton
                  icon={PencilSquareIcon}
                  className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
                  text="Edit"
                  type="button"
                  onClick={() => handleEditLocation(location)}
                />
              </ButtonGroup>
            ),
          })),
        }}
        isLoading={locationsLoading}
        title="Locations"
        subtitle="View, add or edit specific locations that belong to an organizational unit."
        itemFilterQuery={locationsQuery}
        setItemFilterQuery={setLocationsQuery}
        paginationOptions={{
          ...locations,
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
        filterOptions={organizationFilters}
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
