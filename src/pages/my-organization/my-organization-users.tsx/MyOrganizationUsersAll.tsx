import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/auth/useAuth";
import {
  getOrganizationBySlug,
  getOrganizationUsers,
} from "../../../queries/organizations";
import BaseTable from "../../../components/layouts/tables/BaseTable";
import {
  createColumnHelper,
  FilterFnOption,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { OrganizationUser } from "../../../types/api";
import FilterBar from "../../../components/layouts/FilterBar";
import Fuse from "fuse.js";

const columnHelper = createColumnHelper<OrganizationUser>();

const columns = [
  columnHelper.accessor((t) => t.email, {
    id: "email",
    header: "Email",
  }),
  columnHelper.accessor((t) => t.firstName, {
    id: "firstName",
    header: "First Name",
  }),
  columnHelper.accessor((t) => t.lastName, {
    id: "lastName",
    header: "Last Name",
  }),
];

const fuzzyFilterFn: FilterFnOption<OrganizationUser> = (
  row,
  _columnId,
  filterValue
) => {
  // console.debug(row, columnId, filterValue);
  // return true;

  const fuse = new Fuse([row.original], {
    keys: ["email", "firstName", "lastName"],
    threshold: 0.2,
  });

  return fuse.search(filterValue).length > 0;
};

const MyOrganizationUsersAll: React.FC = () => {
  const { keycloak } = useAuth();

  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: [
      "organization",
      "slug",
      keycloak!.tokenParsed!.organization,
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[2]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: [
      "organizations-users",
      myOrganization?.id,
      { limit: 50000 },
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationUsers(queryKey[1], queryKey[2]),
    enabled: !!myOrganization?.id,
  });

  const table = useReactTable({
    data: users?.results ?? [],
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilterFn,
  });

  return (
    <>
      <div className="mt-4 flex flex-col gap-4">
        <FilterBar
          searchOptions={{
            placeholder: "Search by name or email...",
            setSearchQuery: (s) => table.setGlobalFilter(s),
          }}
        />
        <BaseTable
          table={table}
          isLoading={organizationLoading || usersLoading}
          showFooter={false}
        />
      </div>
    </>
  );
};

export default MyOrganizationUsersAll;
