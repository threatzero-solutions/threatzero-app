import { useQuery } from "@tanstack/react-query";
import { getOrganizations } from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import { ItemFilterQueryParams } from "../../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";
import { useImmer } from "use-immer";
import { Link } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/20/solid";
import ButtonGroup from "../../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../../components/layouts/buttons/IconButton";

export const ViewOrganizations: React.FC = () => {
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
              label: <span className="sr-only">Actions</span>,
              key: "actions",
              align: "right",
              noSort: true,
            },
          ],
          rows: (organizations?.results ?? []).map((organization) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            actions: (
              <ButtonGroup className="w-full justify-end">
                <IconButton
                  as={Link}
                  icon={PencilSquareIcon}
                  to={organization.id}
                  className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
                  text="Edit"
                />
              </ButtonGroup>
            ),
          })),
        }}
        isLoading={organizationsLoading}
        title="Organizations"
        subtitle="View, add or edit top-level organizations (i.e. school districts, companies)."
        itemFilterQuery={organizationsQuery}
        setItemFilterQuery={setOrganizationsQuery}
        paginationOptions={{
          ...organizations,
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
          <Link
            to="new"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            + Add New Organization
          </Link>
        }
      />
    </>
  );
};
