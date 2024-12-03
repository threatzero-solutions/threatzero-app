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
import { classNames } from "../../../utils/core";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/20/solid";
import { useAuth } from "../../../contexts/auth/useAuth";
import FilterBar from "../../../components/layouts/FilterBar";
import IconButton from "../../../components/layouts/buttons/IconButton";

const columnHelper = createColumnHelper<OrganizationUser>();

interface GroupMembersTableProps {
  organizationId: Organization["id"];
  joinText?: string;
  leaveText?: string;
  groupId: string;
  unitSlug?: string;
}

const GroupMembersTable: React.FC<GroupMembersTableProps> = ({
  organizationId,
  joinText = "Add to Group",
  leaveText = "Leave Group",
  groupId,
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
        ["groups.ids"]: [groupId],
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
      columnHelper.display({
        id: "actions",
        cell: () => (
          <ButtonGroup className="w-full justify-end">
            <IconButton
              className="bg-red-500 ring-transparent text-white hover:bg-red-600"
              icon={ArrowRightStartOnRectangleIcon}
              text={leaveText}
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [leaveText]
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
          <ArrowRightEndOnRectangleIcon className="size-4 inline" />
          {joinText}
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
        noRowsMessage="No members found."
        showSearch={false}
      />
    </>
  );
};

export default GroupMembersTable;
