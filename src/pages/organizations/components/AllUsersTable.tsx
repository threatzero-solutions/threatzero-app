import {
  ArrowUturnRightIcon,
  BoltIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
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
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useOpenData } from "../../../hooks/use-open-data";
import {
  deleteOrganizationUser,
  getOrganizationUsers,
  getUnits,
} from "../../../queries/organizations";
import { OrganizationUser } from "../../../types/api";
import { type Organization } from "../../../types/entities";
import { classNames, humanizeSlug } from "../../../utils/core";
import { canAccessTraining } from "../../../utils/organization";
import BulkUserUploadSlideOver from "./BulkUserUploadSlideOver";
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
  const editUser = useOpenData<string>();
  const moveUser = useOpenData<OrganizationUser>();
  const [isBulkUserUploadOpen, setIsBulkUserUploadOpen] = useState(false);

  const { hasMultipleUnitAccess, hasPermissions } = useAuth();
  const {
    setOpen: setConfirmationOpen,
    setConfirmationOptions,
    setClose: setConfirmationClose,
  } = useContext(ConfirmationContext);
  const { getMatchingIdp, invalidateOrganizationUsersQuery } =
    useContext(OrganizationsContext);

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
      columnHelper.display({
        id: "sso-linked",
        header: "SSO",
        cell: ({ row }) =>
          getMatchingIdp(row.original.email) ? (
            <span className="text-green-500">
              <BoltIcon className="size-4 inline" /> Linked
            </span>
          ) : (
            <span>&#45;</span>
          ),
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
                  action: () => moveUser.openData(row.original),
                  hidden: !thisUnit || !hasMultipleUnitAccess,
                },
                {
                  id: "edit",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <PencilIcon className="size-4 inline" /> Edit
                    </span>
                  ),
                  action: () => editUser.openData(row.original.id),
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
    [
      units?.results,
      thisUnit,
      hasMultipleUnitAccess,
      handleDeleteUser,
      getMatchingIdp,
      editUser,
      moveUser,
    ]
  );

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        {hasPermissions([WRITE.ORGANIZATION_USERS]) && (
          <>
            <button
              type="button"
              className={classNames(
                "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs enabled:hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-70",
                "inline-flex items-center gap-x-1"
              )}
              title={
                !unitSlug
                  ? "New users can only be added within the context of a unit."
                  : ""
              }
              onClick={() => editUser.openNew()}
            >
              <UserPlusIcon className="size-4 inline" />
              New User
            </button>
            <button
              type="button"
              className={classNames(
                "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs enabled:hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-70",
                "inline-flex items-center gap-x-1"
              )}
              onClick={() => setIsBulkUserUploadOpen(true)}
            >
              <UsersIcon className="size-4 inline" />
              Upload CSV
            </button>
          </>
        )}
        <div className="flex-1"></div>
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
          actions: hasPermissions([WRITE.ORGANIZATION_USERS]),
        }}
        data={users?.results ?? []}
        isLoading={usersLoading}
        pageState={users}
        showFooter={false}
        noRowsMessage="No users found."
        showSearch={false}
      />
      <SlideOver open={editUser.open} setOpen={editUser.setOpen}>
        <EditOrganizationUser
          setOpen={editUser.setOpen}
          create={!editUser.data}
          userId={editUser.data ?? undefined}
        />
      </SlideOver>
      <Modal open={moveUser.open} setOpen={moveUser.setOpen}>
        {moveUser.data && (
          <MoveUnitsForm
            organizationId={organizationId}
            user={moveUser.data}
            setOpen={moveUser.setOpen}
          />
        )}
      </Modal>
      <BulkUserUploadSlideOver
        open={isBulkUserUploadOpen}
        setOpen={setIsBulkUserUploadOpen}
      />{" "}
    </>
  );
};

export default AllUsersTable;
