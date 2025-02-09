import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import ButtonGroup from "../../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../../components/layouts/buttons/IconButton";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import DataTable2 from "../../../../components/layouts/tables/DataTable2";
import { ItemFilterQueryParams } from "../../../../hooks/use-item-filter-query";
import { getOrganizations } from "../../../../queries/organizations";
import { Organization } from "../../../../types/entities";
import EditOrganizationBasic from "../../../organizations/components/EditOrganizationBasic";

const columnHelper = createColumnHelper<Organization>();
const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("slug", {
    header: "Slug",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("createdOn", {
    header: "Created On",
    cell: (info) => dayjs(info.getValue()).format("ll"),
  }),
  columnHelper.display({
    id: "actions",
    cell: (info) => (
      <ButtonGroup className="w-full justify-end">
        <IconButton
          as={Link}
          icon={ArrowRightIcon}
          to={info.row.original.id}
          className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
          trailing
          text="View"
        />
      </ButtonGroup>
    ),
    enableSorting: false,
  }),
];

export const ViewOrganizations: React.FC = () => {
  const [organizationsQuery, setOrganizationsQuery] =
    useImmer<ItemFilterQueryParams>({ order: { name: "ASC" } });
  const [debouncedOrganizationsQuery] = useDebounceValue(
    organizationsQuery,
    300
  );

  const [editBasicInfoOpen, setEditBasicInfoOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["organizations", debouncedOrganizationsQuery] as const,
    queryFn: ({ queryKey }) => getOrganizations(queryKey[1]),
  });

  return (
    <>
      <DataTable2
        data={organizations?.results ?? []}
        columns={columns}
        isLoading={organizationsLoading}
        query={organizationsQuery}
        setQuery={setOrganizationsQuery}
        title="Organizations"
        subtitle="View, add or edit top-level organizations (i.e. school districts, companies)."
        action={
          <button
            type="button"
            onClick={() => setEditBasicInfoOpen(true)}
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            + Add New Organization
          </button>
        }
        pageState={organizations}
        showFooter={false}
        noRowsMessage="No organizations found."
      />
      <SlideOver open={editBasicInfoOpen} setOpen={setEditBasicInfoOpen}>
        <EditOrganizationBasic
          setOpen={setEditBasicInfoOpen}
          create={false}
          organizationId={null}
          level={"organization"}
          onSaveSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["organizations", debouncedOrganizationsQuery],
            });
          }}
        />
      </SlideOver>
    </>
  );
};
