import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import FilterBar from "../../../components/layouts/FilterBar";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import {
  assignOrganizationUserToRoleGroup,
  getOrganizationUsers,
  getUnits,
  revokeOrganizationUserToRoleGroup,
} from "../../../queries/organizations";
import { OrganizationUser } from "../../../types/api";
import { Organization } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import AddUserPopover from "./AddUserPopover";

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

  const queryClient = useQueryClient();
  const invalidateGroupMembersQuery = useCallback(
    () =>
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey.length >= 3 &&
          queryKey[0] === "organizations-users" &&
          !!queryKey[2] &&
          typeof queryKey[2] === "object" &&
          "unit" in queryKey[2] &&
          queryKey[2].unit === unitSlug &&
          "groups.ids" in queryKey[2] &&
          Array.isArray(queryKey[2]["groups.ids"]) &&
          queryKey[2]["groups.ids"].includes(groupId),
      }),
    [queryClient, unitSlug, groupId]
  );

  const { mutate: admitUsers, isPending: isAdmittingUsers } = useMutation({
    mutationFn: ({ users }: { users: OrganizationUser[]; close: () => void }) =>
      Promise.all(
        users.map((u) =>
          assignOrganizationUserToRoleGroup(organizationId, u.id, {
            groupId,
          })
        )
      ),
    onSuccess: (_data, { close }) => {
      close();
      invalidateGroupMembersQuery();
    },
  });

  const { mutate: revokeUser, isPending: isRevokingUser } = useMutation({
    mutationFn: (user: OrganizationUser) =>
      revokeOrganizationUserToRoleGroup(organizationId, user.id, {
        groupId,
      }),
    onSuccess: () => {
      invalidateGroupMembersQuery();
    },
  });

  const handleAddUsersToGroup = (
    users: OrganizationUser[],
    close: () => void
  ) => {
    admitUsers({
      users,
      close,
    });
  };

  const handleRevokeUserFromGroup = useCallback(
    (user: OrganizationUser) => {
      revokeUser(user);
    },
    [revokeUser]
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
        cell: ({ row: { original } }) => (
          <ButtonGroup className="w-full justify-end">
            <IconButton
              className={classNames(
                "bg-red-500 ring-transparent text-white enabled:hover:bg-red-600",
                isRevokingUser ? "animate-pulse" : ""
              )}
              icon={ArrowRightStartOnRectangleIcon}
              text={leaveText}
              onClick={() => handleRevokeUserFromGroup(original)}
              disabled={isRevokingUser}
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [leaveText, handleRevokeUserFromGroup, isRevokingUser]
  );
  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <AddUserPopover
          organizationId={organizationId}
          unitSlug={unitSlug}
          onAddUsers={handleAddUsersToGroup}
          isPending={isAdmittingUsers}
          appendQuery={{
            ["groups.ids"]: [groupId],
            ["groups.op"]: "none",
          }}
          button={
            <button
              type="button"
              className={classNames(
                "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
                "inline-flex items-center gap-x-1"
              )}
            >
              <ArrowRightEndOnRectangleIcon className="size-4 inline" />
              {joinText}
            </button>
          }
        />
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
