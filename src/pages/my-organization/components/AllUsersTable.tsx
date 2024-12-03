import { createColumnHelper } from "@tanstack/react-table";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { OrganizationUser } from "../../../types/api";
import { useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationUsers, getUnits } from "../../../queries/organizations";
import { Organization } from "../../../types/entities";
import { classNames, humanizeSlug } from "../../../utils/core";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import Dropdown from "../../../components/layouts/Dropdown";
import {
  ArrowUturnRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import { useAuth } from "../../../contexts/auth/useAuth";
import FilterBar from "../../../components/layouts/FilterBar";

const columnHelper = createColumnHelper<OrganizationUser>();

interface AllUsersTableProps {
  organizationId: Organization["id"];
  unitSlug?: string;
}

const AllUsersTable: React.FC<AllUsersTableProps> = ({
  organizationId,
  unitSlug,
}) => {
  const { hasMultipleUnitAccess } = useAuth();

  const [usersQuery, setUsersQuery] = useImmer<ItemFilterQueryParams>({
    order: { createdTimestamp: "DESC" },
  });
  const [debouncedUsersQuery] = useDebounceValue(usersQuery, 500);
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: [
      "organizations-users",
      organizationId,
      {
        ...debouncedUsersQuery,
        unit: unitSlug,
      },
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationUsers(queryKey[1], queryKey[2]),
  });

  const { data: units } = useQuery({
    queryKey: [
      "units",
      { ["organization.id"]: organizationId, slug: unitSlug },
    ] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
  });

  const thisUnit = useMemo(
    () => units?.results?.find((u) => u.slug === unitSlug),
    [units, unitSlug]
  );

  const columns = useMemo(
    () => [
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
      columnHelper.accessor((t) => t.attributes.unit, {
        id: "unit",
        header: "Unit",
        cell: (info) => (
          <span>
            {info
              .getValue()
              ?.map((u) => units?.results?.find((unit) => unit.slug === u))
              .filter(Boolean)
              .find((u) => u)?.name ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor((t) => t.attributes.audience, {
        id: "audience",
        header: "Training Groups",
        cell: (info) => (
          <span>
            {info
              .getValue()
              ?.map((a) => humanizeSlug(a))
              ?.join(", ") ?? "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: () => (
          <ButtonGroup className="w-full justify-end">
            <Dropdown
              valueIcon={<EllipsisVerticalIcon className="size-4" />}
              actions={[
                {
                  id: "move",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <ArrowUturnRightIcon className="size-4 inline" /> Move
                    </span>
                  ),
                  action: () => {},
                  hidden: !thisUnit,
                },
                {
                  id: "edit",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <PencilIcon className="size-4 inline" /> Edit
                    </span>
                  ),
                  action: () => {},
                },
                {
                  id: "delete",
                  value: (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <TrashIcon className="size-4 inline" /> Delete
                    </span>
                  ),
                  action: () => {},
                },
              ]}
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [units?.results, thisUnit]
  );
  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          className={classNames(
            "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
            "inline-flex items-center gap-x-1"
          )} // onClick={() => handleNewUser()}
        >
          <UserPlusIcon className="size-4 inline" />
          New User
        </button>
        <FilterBar
          searchOptions={{
            placeholder: "Search by name or email...",
            searchQuery: usersQuery.search,
            setSearchQuery: (search) => {
              setUsersQuery((draft) => {
                draft.search = search;
                draft.offset = 0;
              });
            },
          }}
        />
      </div>
      <DataTable2
        columns={columns}
        columnVisibility={{
          unit: hasMultipleUnitAccess && !thisUnit,
        }}
        data={users?.results ?? []}
        isLoading={usersLoading}
        pageState={users}
        showFooter={false}
        noRowsMessage="No users found."
        showSearch={false}
        // action={
        //   <IconButton
        //     icon={UserPlusIcon}
        //     className="bg-secondary-600 ring-transparent text-white hover:bg-secondary-500 px-3 py-2 text-sm"
        //     text="Add New User"
        //     type="button"
        //     // onClick={() => handleNewUser()}
        //   />
        // }
      />
    </>
  );
};

export default AllUsersTable;
