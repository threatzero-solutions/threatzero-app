import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getOrganizations } from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditOrganization from "./EditOrganization";
import { Organization } from "../../../../types/entities";
import { ItemFilterQueryParams } from "../../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";
import { useImmer } from "use-immer";

export const ViewOrganizations: React.FC = () => {
  const [editOrganizationSliderOpen, setEditOrganizationSliderOpen] =
    useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<
    Partial<Organization> | undefined
  >();

  const [organizationsQuery, setOrganizationsQuery] =
    useImmer<ItemFilterQueryParams>({ order: { name: "ASC" } });
  const [debouncedOrganizationsQuery] = useDebounceValue(
    organizationsQuery,
    300
  );

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["organizations", debouncedOrganizationsQuery] as const,
    queryFn: ({ queryKey }) => getOrganizations(queryKey[1]),
  });

  const handleEditOrganization = (organization?: Organization) => {
    setSelectedOrganization(organization);
    setEditOrganizationSliderOpen(true);
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
              label: "Slug",
              key: "slug",
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
              noSort: true,
            },
          ],
          rows: (organizations?.results ?? []).map((organization) => ({
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
        }}
        isLoading={organizationsLoading}
        title="Organizations"
        subtitle="View, add or edit top-level organizations (i.e. school districts, companies)."
        orderOptions={{
          order: organizationsQuery.order,
          setOrder: (k, v) => {
            setOrganizationsQuery((q) => {
              q.order = { [k]: v };
              q.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: organizations?.offset,
          total: organizations?.count,
          limit: organizations?.limit,
          setOffset: (offset) =>
            setOrganizationsQuery((q) => {
              q.offset = offset;
            }),
        }}
        searchOptions={{
          searchQuery: organizationsQuery.search ?? "",
          setSearchQuery: (search) => {
            setOrganizationsQuery((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
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
