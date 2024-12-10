import { Link } from "react-router";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import {
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  QrCodeIcon,
} from "@heroicons/react/20/solid";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useContext, useMemo, useState } from "react";
import { Location } from "../../../types/entities";
import dayjs from "dayjs";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generateQrCode, getLocations } from "../../../queries/organizations";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import FilterBar from "../../../components/layouts/FilterBar";
import { classNames, simulateDownload, slugify } from "../../../utils/core";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import EditSOSLocation from "./EditSOSLocation";
import { AlertContext } from "../../../contexts/alert/alert-context";

const locationsColumnHelper = createColumnHelper<Location>();

interface SOSLocationsTableProps {
  unitId: string;
}

const SOSLocationsTable: React.FC<SOSLocationsTableProps> = ({ unitId }) => {
  const [editLocationOpen, setEditLocationOpen] = useState<boolean>(false);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);

  const { setInfo } = useContext(AlertContext);

  const [locationsQuery, setLocationsQuery] = useImmer<ItemFilterQueryParams>({
    order: { createdTimestamp: "DESC" },
  });
  const [debouncedLocationsQuery] = useDebounceValue(locationsQuery, 300);
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: [
      "locations",
      { ...debouncedLocationsQuery, ["unit.id"]: unitId },
    ] as const,
    queryFn: ({ queryKey }) => getLocations(queryKey[1]),
    enabled: !!unitId,
  });

  const handleEditLocation = (locationId?: string) => {
    setSelectedLocationId(locationId);
    setEditLocationOpen(true);
  };

  const handleNewLocation = () => {
    handleEditLocation();
  };

  const { mutate: downloadQrCode } = useMutation({
    mutationFn: (location: Location) => generateQrCode(location.locationId),
    onSuccess: ({ locationId, data }, location: Location) => {
      simulateDownload(
        data,
        `sos-qr-code_${slugify(location.name)}_${locationId}.png`
      );

      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const handleDownloadQRCode = useCallback(
    (location: Location) => {
      setInfo("Downloading QR code...");
      downloadQrCode(location);
    },
    [setInfo, downloadQrCode]
  );

  const locationColumns = useMemo(
    () => [
      locationsColumnHelper.accessor("name", {
        header: "Name",
      }),
      locationsColumnHelper.accessor("locationId", {
        header: "Location ID",
      }),
      locationsColumnHelper.accessor("createdOn", {
        header: "Created On",
        cell: ({ getValue }) => dayjs(getValue()).format("ll"),
      }),
      locationsColumnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ButtonGroup className="w-full justify-end">
            <IconButton
              as={Link}
              icon={LinkIcon}
              to={`/sos/?loc_id=${row.original.locationId}`}
              target="_blank"
              className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
              text="SOS Link"
            />
            <IconButton
              icon={QrCodeIcon}
              className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
              text="QR Code"
              type="button"
              onClick={() => handleDownloadQRCode(row.original)}
            />
            <IconButton
              icon={PencilSquareIcon}
              className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
              text="Edit"
              type="button"
              onClick={() => handleEditLocation(row.original.id)}
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [handleDownloadQRCode]
  );

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            className={classNames(
              "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
              "inline-flex items-center gap-x-1"
            )}
            onClick={() => handleNewLocation()}
          >
            <PlusIcon className="size-4 inline" />
            New Location
          </button>
          <FilterBar
            searchOptions={{
              placeholder: "Search by location name...",
              searchQuery: locationsQuery.search,
              setSearchQuery: (s) =>
                setLocationsQuery((q) => {
                  q.search = s;
                  q.offset = 0;
                }),
            }}
          />
        </div>
        <DataTable2
          data={locations?.results ?? []}
          columns={locationColumns}
          isLoading={locationsLoading}
          pageState={locations}
          query={locationsQuery}
          setQuery={setLocationsQuery}
          showFooter={false}
          showSearch={false}
        />
      </div>
      <SlideOver open={editLocationOpen} setOpen={setEditLocationOpen}>
        <EditSOSLocation
          setOpen={setEditLocationOpen}
          create={!selectedLocationId}
          locationId={selectedLocationId}
          unitId={unitId}
        />
      </SlideOver>
    </>
  );
};

export default SOSLocationsTable;
