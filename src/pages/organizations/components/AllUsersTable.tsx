import {
  ArrowUturnRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import Dropdown from "../../../components/layouts/Dropdown";
import FilterBar from "../../../components/layouts/FilterBar";
import Modal from "../../../components/layouts/modal/Modal";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import {
  deleteOrganizationUser,
  getOrganizationUsers,
  getUnits,
} from "../../../queries/organizations";
import { OrganizationUser } from "../../../types/api";
import { type Organization } from "../../../types/entities";
import { classNames, humanizeSlug } from "../../../utils/core";
import { canAccessTraining } from "../../../utils/organization";
import EditOrganizationUser from "./EditOrganizationUser";
import { default as MoveUnitsForm } from "./MoveUnitsForm";

const columnHelper = createColumnHelper<OrganizationUser>();

interface AllUsersTableProps {
  organizationId: Organization["id"];
  unitSlug?: string;
}

const AllUsersTable: React.FC<AllUsersTableProps> = ({
  organizationId,
  unitSlug,
}) => {
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [moveUserDialogOpen, setMoveUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [selectedUserToMove, setSelectedUserToMove] = useState<
    OrganizationUser | undefined
  >();

  const { hasMultipleUnitAccess } = useAuth();
  const {
    setOpen: setConfirmationOpen,
    setConfirmationOptions,
    setClose: setConfirmationClose,
  } = useContext(ConfirmationContext);
  const { invalidateOrganizationUsersQuery } = useContext(OrganizationsContext);

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

  const handleEditUser = (userId?: string) => {
    setSelectedUserId(userId);
    setEditUserOpen(true);
  };

  const handleNewUser = () => {
    handleEditUser();
  };

  const { mutate: doDelete, isPending: isDeletePending } = useMutation({
    mutationFn: (userId: string) =>
      deleteOrganizationUser(organizationId, userId),
    onSuccess: () => {
      invalidateOrganizationUsersQuery();
      setConfirmationClose();
    },
  });

  useEffect(() => {
    setConfirmationOptions((draft) => {
      draft.isPending = isDeletePending;
    });
  }, [isDeletePending, setConfirmationOptions]);

  const handleDeleteUser = useCallback(
    (user: OrganizationUser) => {
      setConfirmationOpen({
        title: "Delete User",
        message: (
          <span>
            Are you sure you want to delete the following user account?
            <span className="block font-bold mt-2">
              {user.firstName} {user.lastName} ({user.email})
            </span>
          </span>
        ),
        onConfirm: () => {
          doDelete(user.id);
        },
        destructive: true,
        confirmText: "Delete",
      });
    },
    [setConfirmationOpen, doDelete]
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
        cell: ({ row, getValue }) => (
          <span>
            {(canAccessTraining(row.original)
              ? getValue()
                  ?.map((a) => humanizeSlug(a))
                  ?.join(", ")
              : null) ?? "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
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
                  action: () => {
                    setSelectedUserToMove(row.original);
                    setMoveUserDialogOpen(true);
                  },
                  hidden: !thisUnit || !hasMultipleUnitAccess,
                },
                {
                  id: "edit",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <PencilIcon className="size-4 inline" /> Edit
                    </span>
                  ),
                  action: () => handleEditUser(row.original.id),
                },
                {
                  id: "delete",
                  value: (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <TrashIcon className="size-4 inline" /> Delete
                    </span>
                  ),
                  action: () => handleDeleteUser(row.original),
                },
              ]}
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [units?.results, thisUnit, hasMultipleUnitAccess, handleDeleteUser]
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          className={classNames(
            "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm enabled:hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-70",
            "inline-flex items-center gap-x-1"
          )}
          disabled={!unitSlug}
          title={
            !unitSlug
              ? "New users can only be added within the context of a unit."
              : ""
          }
          onClick={() => handleNewUser()}
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
      />
      <SlideOver open={editUserOpen} setOpen={setEditUserOpen}>
        <EditOrganizationUser
          setOpen={setEditUserOpen}
          create={!selectedUserId}
          userId={selectedUserId}
        />
      </SlideOver>
      <Modal open={moveUserDialogOpen} setOpen={setMoveUserDialogOpen}>
        {selectedUserToMove && (
          <MoveUnitsForm
            organizationId={organizationId}
            user={selectedUserToMove}
            setOpen={setMoveUserDialogOpen}
          />
        )}
      </Modal>
    </>
  );
};

export default AllUsersTable;
