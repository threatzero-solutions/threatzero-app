/**
 * Merged Users + Access surface. One table, one source of truth for
 * "who's in this org and what can they do?". Identity still comes from
 * Keycloak (source of truth); grants come from the DB. See
 * `_docs/users-access-merge-plan.md` for the architecture and the
 * planned swap to DB-only reads once the KC webhook mirror lands.
 */
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import Checkbox from "../../../components/forms/inputs/Checkbox";
import SearchInput from "../../../components/forms/inputs/SearchInput";
import Dropdown from "../../../components/layouts/Dropdown";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useOpenData } from "../../../hooks/use-open-data";
import {
  UserWithAccess,
  UsersWithAccessQuery,
  usersWithGrantsKey,
} from "../../../queries/grants";
import {
  activateOrganizationUser,
  deactivateOrganizationUser,
} from "../../../queries/organizations";
import {
  useAssignableRoles,
  useUsersWithAccess,
} from "../../../queries/use-grants";
import { cn } from "../../../utils/core";
import { labelsForPreset } from "../../../utils/labels";
import { getUnitAndDescendantSlugs } from "../../../utils/units";
import BulkUserUploadSlideOver from "./BulkUserUploadSlideOver";
import EditOrganizationUser from "./EditOrganizationUser";
import RoleAssignmentEditor from "./RoleAssignmentEditor";
import { roleChipClass, sortRoleSlugs } from "./roleDisplay";

interface Props {
  orgId: string;
  onOpenHistory: () => void;
}

const columnHelper = createColumnHelper<UserWithAccess>();

const OrganizationsAccessAssignments: React.FC<Props> = ({
  orgId,
  onOpenHistory,
}) => {
  const { currentOrganization, allUnits, currentUnitSlug } =
    useContext(OrganizationsContext);
  const { hasPermissions, isGlobalAdmin } = useAuth();
  const queryClient = useQueryClient();
  const {
    setOpen: setConfirmationOpen,
    setConfirmationOptions,
    setClose: setConfirmationClose,
  } = useContext(ConfirmationContext);

  const labels = useMemo(
    () => labelsForPreset(currentOrganization?.labelPreset),
    [currentOrganization?.labelPreset],
  );

  const { data: assignableRoles } = useAssignableRoles(orgId);
  const roleLabelBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of assignableRoles ?? []) map.set(r.slug, r.name);
    return map;
  }, [assignableRoles]);
  const roleLabel = useCallback(
    (slug: string) => roleLabelBySlug.get(slug) ?? slug,
    [roleLabelBySlug],
  );

  // Map unit slug → display name so the Unit column shows the human-readable
  // name rather than the slug. Falls back to the slug itself when the unit
  // isn't in the loaded list (e.g., peer-unit references from KC).
  const unitNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of allUnits ?? []) {
      map.set(u.slug, u.name);
    }
    return map;
  }, [allUnits]);

  const [query, setQuery] = useImmer<ItemFilterQueryParams>({
    limit: 25,
    offset: 0,
    order: { firstName: "ASC" },
    enabled: true,
  });

  // When a unit is active in the breadcrumb, narrow the list to users homed
  // in that unit — or any of its descendant units. Picking a parent unit
  // should show everything underneath it, not an empty list when users are
  // only homed in sub-units. Resetting offset on unit change keeps
  // pagination sane when the user drills in/out.
  const unitFilter = useMemo(() => {
    if (!currentUnitSlug) return undefined;
    return getUnitAndDescendantSlugs(allUnits, currentUnitSlug);
  }, [currentUnitSlug, allUnits]);

  useEffect(() => {
    setQuery((draft) => {
      if (unitFilter) {
        draft.unit = unitFilter;
      } else {
        Reflect.deleteProperty(draft, "unit");
      }
      draft.offset = 0;
    });
  }, [unitFilter, setQuery]);

  const [debouncedQuery] = useDebounceValue(query, 250);
  const [editing, setEditing] = useState<UserWithAccess | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const editUser = useOpenData<string>();

  const { data, isLoading } = useUsersWithAccess(
    orgId,
    debouncedQuery as UsersWithAccessQuery,
  );

  const { mutate: updateUserActivation, isPending: isUpdatingActivation } =
    useMutation({
      mutationFn: (args: { idpId: string; deactivate: boolean }) =>
        args.deactivate
          ? deactivateOrganizationUser(orgId, args.idpId)
          : activateOrganizationUser(orgId, args.idpId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: usersWithGrantsKey(orgId) });
        setConfirmationClose();
      },
    });

  useEffect(() => {
    setConfirmationOptions((draft) => {
      draft.isPending = isUpdatingActivation;
    });
  }, [isUpdatingActivation, setConfirmationOptions]);

  const handleToggleActivation = useCallback(
    (user: UserWithAccess) => {
      const deactivate = user.enabled;
      const display =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email ||
        user.idpId;
      setConfirmationOpen({
        title: deactivate ? "Deactivate User" : "Activate User",
        message: (
          <span>
            Are you sure you want to {deactivate ? "deactivate" : "activate"}{" "}
            the following user account?
            <span className="block font-bold mt-2">
              {display}
              {user.email ? ` (${user.email})` : ""}
            </span>
          </span>
        ),
        onConfirm: () =>
          updateUserActivation({ idpId: user.idpId, deactivate }),
        destructive: deactivate,
        confirmText: deactivate ? "Deactivate" : "Activate",
      });
    },
    [setConfirmationOpen, updateUserActivation],
  );

  const displayName = (user: UserWithAccess) => {
    const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return joined || user.email || "—";
  };

  const canWrite = hasPermissions([WRITE.ORGANIZATION_USERS]);

  const columns = useMemo(
    () => [
      // Sort by firstName since that's what leads the cell — the secondary
      // email line isn't sortable and would make "User" ambiguous otherwise.
      columnHelper.accessor((u) => u.firstName ?? "", {
        id: "firstName",
        header: "User",
        cell: ({ row: { original } }) => {
          const inactive = !original.enabled;
          return (
            <div className="flex items-start gap-2">
              {inactive && (
                <XCircleIcon
                  aria-label="Deactivated"
                  className="mt-0.5 size-4 shrink-0 text-gray-400"
                />
              )}
              <div className={cn(inactive && "text-gray-400")}>
                <div
                  className={cn(
                    "text-sm font-medium",
                    inactive ? "line-through" : "text-gray-900",
                  )}
                >
                  {displayName(original)}
                </div>
                {original.email && (
                  <div
                    className={cn(
                      "text-xs",
                      inactive ? "line-through text-gray-400" : "text-gray-500",
                    )}
                  >
                    {original.email}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((u) => u.unitSlug ?? "", {
        id: "unit",
        header: labels.unitSingular,
        cell: ({ row: { original } }) => {
          const slug = original.unitSlug;
          if (!slug) {
            return <span className="italic text-gray-400">—</span>;
          }
          return (
            <span className="text-sm text-gray-700">
              {unitNameBySlug.get(slug) ?? slug}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "roles",
        header: "Roles",
        enableSorting: false,
        cell: ({ row: { original } }) => {
          const orgSlugs = original.grants
            .filter((g) => g.unitId == null)
            .map((g) => g.roleSlug);
          const unitCount = original.grants.filter(
            (g) => g.unitId != null,
          ).length;
          const sortedSlugs = sortRoleSlugs(orgSlugs);
          // Only system admins see the "System admin" chip — org-admins
          // shouldn't even know whether someone holds the role, since the
          // role is managed entirely outside the org module.
          const showSysAdmin = original.isSystemAdmin && isGlobalAdmin;
          const noOrgRoles = sortedSlugs.length === 0;
          return (
            <div className="flex flex-wrap gap-1.5">
              {showSysAdmin && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleChipClass("system-admin")}`}
                  title="Managed in Admin Panel → System admins"
                >
                  System admin
                </span>
              )}
              {noOrgRoles && !showSysAdmin ? (
                <span className="text-xs italic text-gray-400">None</span>
              ) : (
                sortedSlugs.map((slug) => (
                  <span
                    key={slug}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleChipClass(slug)}`}
                  >
                    {roleLabel(slug)}
                  </span>
                ))
              )}
              {unitCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  +{unitCount} {labels.unitSingular.toLowerCase()}
                  {unitCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row: { original } }) => {
          const canEditRoles = !!original.userId;
          return (
            <ButtonGroup className="w-full justify-end">
              <Dropdown
                valueIcon={<EllipsisVerticalIcon className="size-4" />}
                actions={[
                  {
                    id: "edit-roles",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheckIcon className="size-4 inline" /> Edit roles
                      </span>
                    ),
                    action: () => setEditing(original),
                    disabled: !canEditRoles,
                  },
                  {
                    id: "edit-user",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <PencilIcon className="size-4 inline" /> Edit user
                      </span>
                    ),
                    action: () => editUser.openData(original.idpId),
                  },
                  {
                    id: "toggle-activation",
                    value: (() => {
                      const Icon = original.enabled
                        ? XCircleIcon
                        : CheckCircleIcon;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            original.enabled
                              ? "text-red-500"
                              : "text-green-500",
                          )}
                        >
                          <Icon className="size-4 inline" />{" "}
                          {original.enabled ? "Deactivate" : "Activate"}
                        </span>
                      );
                    })(),
                    action: () => handleToggleActivation(original),
                  },
                ]}
              />
            </ButtonGroup>
          );
        },
      }),
    ],
    [
      labels,
      unitNameBySlug,
      editUser,
      handleToggleActivation,
      roleLabel,
      isGlobalAdmin,
    ],
  );

  const includeInactive = query.enabled === undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg bg-white p-4 ring-1 ring-gray-900/5">
        <div className="flex flex-wrap items-center gap-4">
          {canWrite && (
            <Dropdown
              buttonClassName="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              value={
                <span className="inline-flex items-center gap-x-1">
                  <UserPlusIcon className="size-4" />
                  Add users
                </span>
              }
              valueIcon={
                <ChevronDownIcon
                  aria-hidden="true"
                  className="-mr-1 size-5 text-white/80"
                />
              }
              actions={[
                {
                  id: "add-one",
                  // EditOrganizationUser lets the admin pick the unit, so
                  // this is safe at org scope — the old KC-backed flow had
                  // the same dialog.
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <UserPlusIcon className="size-4" /> Add a user
                    </span>
                  ),
                  action: () => editUser.openNew(),
                },
                {
                  id: "import-csv",
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <DocumentArrowUpIcon className="size-4" /> Import from CSV
                    </span>
                  ),
                  action: () => setIsBulkUploadOpen(true),
                },
              ]}
            />
          )}
          {canWrite && (
            <label
              htmlFor="include-inactive-users"
              className="flex items-center gap-2"
            >
              <Checkbox
                id="include-inactive-users"
                checked={includeInactive}
                onChange={(checked) => {
                  setQuery((draft) => {
                    if (checked) {
                      Reflect.deleteProperty(draft, "enabled");
                    } else {
                      draft.enabled = true;
                    }
                    draft.offset = 0;
                  });
                }}
              />
              <span className="text-xs font-semibold">Show inactive</span>
            </label>
          )}
          <div className="flex-1" />
          <SearchInput
            placeholder="Search name or email"
            searchQuery={query.search ?? ""}
            setSearchQuery={(search) =>
              setQuery((draft) => {
                draft.search = search;
                draft.offset = 0;
              })
            }
          />
          <Dropdown
            iconOnly
            value="More actions"
            valueIcon={<EllipsisVerticalIcon className="size-5" />}
            actions={[
              {
                id: "change-log",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="size-4" /> Change log
                  </span>
                ),
                action: onOpenHistory,
              },
            ]}
          />
        </div>

        <DataTable2
          columns={columns}
          data={data?.results ?? []}
          pageState={data}
          isLoading={isLoading}
          query={query}
          setQuery={setQuery}
          showSearch={false}
          noRowsMessage={
            !canWrite
              ? "No users in this organization yet."
              : `No users yet. Use "Add users" above to add one.`
          }
        />
      </div>

      <RoleAssignmentEditor
        orgId={orgId}
        user={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
      <SlideOver open={editUser.open} setOpen={editUser.setOpen}>
        <EditOrganizationUser
          setOpen={editUser.setOpen}
          create={!editUser.data}
          userId={editUser.data ?? undefined}
        />
      </SlideOver>
      <BulkUserUploadSlideOver
        open={isBulkUploadOpen}
        setOpen={setIsBulkUploadOpen}
      />
    </div>
  );
};

export default OrganizationsAccessAssignments;
