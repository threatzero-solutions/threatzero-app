import {
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  QrCodeIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import FilterBar, {
  FilterBarFilterOptions,
} from "../../../components/layouts/FilterBar";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { generateQrCode, getLocations } from "../../../queries/organizations";
import { Location } from "../../../types/entities";
import { classNames, simulateDownload, slugify } from "../../../utils/core";
import EditSOSLocation from "./EditSOSLocation";

const locationsColumnHelper = createColumnHelper<Location>();

interface SOSLocationsTableProps {
  /**
   * When set, the table is scoped to this unit. The Scope column and unit
   * filter are hidden (no need to display info that's already constant or
   * to filter inside a single-unit view). Create / edit affordances stay
   * available — new locations are pinned to this unit automatically.
   */
  unitId?: string;
}

const SOSLocationsTable: React.FC<SOSLocationsTableProps> = ({ unitId }) => {
  const unitScoped = !!unitId;

  const [editLocationOpen, setEditLocationOpen] = useState<boolean>(false);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);

  const { setInfo, clearAlert } = useContext(AlertContext);
  const infoAlertId = useAlertId();
  const { allUnits, currentOrganization } = useContext(OrganizationsContext);
  const orgId = currentOrganization?.id;

  const [locationsQuery, setLocationsQuery] = useImmer<ItemFilterQueryParams>({
    order: { createdTimestamp: "DESC" },
  });
  const [debouncedLocationsQuery] = useDebounceValue(locationsQuery, 300);
  // System admins bypass the API's tenant filter, so scope the query to the
  // org being viewed. Without this they'd see every org's locations on any
  // org page.
  const queryParams = useMemo(
    () => ({
      ...debouncedLocationsQuery,
      ...(orgId ? { ["organization.id"]: orgId } : {}),
      ...(unitId ? { ["unit.id"]: unitId } : {}),
    }),
    [debouncedLocationsQuery, orgId, unitId],
  );
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", queryParams] as const,
    queryFn: ({ queryKey }) => getLocations(queryKey[1]),
    enabled: !!orgId,
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
        `sos-qr-code_${slugify(location.name)}_${locationId}.png`,
      );

      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const handleDownloadQRCode = useCallback(
    (location: Location) => {
      setInfo("Downloading QR code...", { id: infoAlertId });
      downloadQrCode(location);
    },
    [setInfo, downloadQrCode, infoAlertId],
  );

  const filterOptions = useMemo<FilterBarFilterOptions | undefined>(() => {
    if (unitScoped) return undefined;
    const sortedUnits = [...(allUnits ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return {
      filters: [
        {
          key: "unit.id",
          label: "Unit",
          many: true,
          defaultValue: locationsQuery["unit.id"] as string[] | undefined,
          options: sortedUnits.map((u) => ({ value: u.id, label: u.name })),
        },
      ],
      setQuery: setLocationsQuery,
    };
  }, [unitScoped, allUnits, locationsQuery, setLocationsQuery]);

  const locationColumns = useMemo(() => {
    const columns = [
      locationsColumnHelper.accessor("name", {
        header: "Name",
      }),
      locationsColumnHelper.accessor("locationId", {
        header: "Location ID",
      }),
    ];

    // The Scope column only appears when we're not already filtered to one
    // unit. It tells you, at a glance, whether routing flows to the unit's
    // TAT or straight to the org-wide TAT.
    if (!unitId) {
      columns.push(
        locationsColumnHelper.display({
          id: "scope",
          header: "Scope",
          cell: ({ row }) => {
            const unit = row.original.unit;
            return unit ? (
              <span className="text-gray-900">{unit.name}</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800 ring-1 ring-inset ring-primary-200">
                Organization-wide
              </span>
            );
          },
        }) as never,
      );
    }

    columns.push(
      locationsColumnHelper.accessor("createdOn", {
        header: "Created On",
        cell: ({ getValue }) => dayjs(getValue()).format("ll"),
      }) as never,
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
      }) as never,
    );

    return columns;
  }, [handleDownloadQRCode, unitId]);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            className={classNames(
              "block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600",
              "inline-flex items-center gap-x-1",
            )}
            onClick={() => handleNewLocation()}
          >
            <PlusIcon className="size-4 inline" />
            New Location
          </button>
          <FilterBar
            filterOptions={filterOptions}
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
