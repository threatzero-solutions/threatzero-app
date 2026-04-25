/**
 * Merged Users + Access surface. One table, one source of truth for
 * "who's in this org and what can they do?". Identity still comes from
 * Keycloak (source of truth); grants come from the DB. See
 * `_docs/users-access-merge-plan.md` for the architecture and the
 * planned swap to DB-only reads once the KC webhook mirror lands.
 */
import { useContext, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { UserWithAccess } from "../../../queries/grants";
import { useUsersWithAccess } from "../../../queries/use-grants";
import { labelsForPreset } from "../../../utils/labels";
import RoleAssignmentEditor from "./RoleAssignmentEditor";
import { roleChipClass, roleLabel, sortRoleSlugs } from "./roleDisplay";

interface Props {
  orgId: string;
  orgName: string;
}

const PAGE_SIZE = 25;

const OrganizationsAccessAssignments: React.FC<Props> = ({
  orgId,
  orgName,
}) => {
  const { currentOrganization } = useContext(OrganizationsContext);
  const labels = useMemo(
    () => labelsForPreset(currentOrganization?.labelPreset),
    [currentOrganization?.labelPreset],
  );

  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounceValue(searchInput.trim(), 250);
  const [editing, setEditing] = useState<UserWithAccess | null>(null);

  const query = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      search: debouncedSearch || undefined,
    }),
    [offset, debouncedSearch],
  );

  const { data, isLoading, isFetching } = useUsersWithAccess(orgId, query);

  const users = data?.results ?? [];
  const count = data?.count ?? 0;
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const displayName = (user: UserWithAccess) => {
    const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return joined || user.email || "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500">
            Everyone with access to {orgName} — identity from Keycloak, roles
            from ThreatZero. Changes take effect immediately.
          </p>
        </div>
        <div>
          <label htmlFor="users-search" className="sr-only">
            Search users
          </label>
          <input
            id="users-search"
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setOffset(0);
            }}
            placeholder="Search name or email"
            className="w-full sm:w-64 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <HeaderCell>User</HeaderCell>
              <HeaderCell>{labels.unitSingular}</HeaderCell>
              <HeaderCell>Roles</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <EmptyRow>Loading…</EmptyRow>
            ) : users.length === 0 ? (
              <EmptyRow>
                {debouncedSearch
                  ? "No users match that search."
                  : "No users in this organization yet."}
              </EmptyRow>
            ) : (
              users.map((user) => {
                const orgSlugs = user.grants
                  .filter((g) => g.unitId == null)
                  .map((g) => g.roleSlug);
                const unitCount = user.grants.filter(
                  (g) => g.unitId != null,
                ).length;
                const sortedSlugs = sortRoleSlugs(orgSlugs);
                const canEdit = !!user.userId;
                return (
                  <tr
                    key={user.idpId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {displayName(user)}
                      </div>
                      {user.email && (
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.unitSlug ? (
                        user.unitSlug
                      ) : (
                        <span className="italic text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5">
                        {sortedSlugs.length === 0 ? (
                          <span className="text-xs italic text-gray-400">
                            None
                          </span>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.enabled ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-green-500"
                          />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-gray-400"
                          />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        type="button"
                        aria-label={`Edit roles for ${displayName(user)}`}
                        title={
                          canEdit
                            ? undefined
                            : "User must log in once before roles can be assigned"
                        }
                        disabled={!canEdit}
                        className="inline-flex items-center rounded-md px-3 py-2 font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                        onClick={() => canEdit && setEditing(user)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {count > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Page {currentPage} of {totalPages}
            {isFetching && <span className="ml-2 text-gray-400">Loading…</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= count}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <RoleAssignmentEditor
        orgId={orgId}
        user={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
};

const HeaderCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th
    scope="col"
    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
  >
    {children}
  </th>
);

const EmptyRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr>
    <td
      colSpan={5}
      className="px-6 py-10 text-center text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      {children}
    </td>
  </tr>
);

export default OrganizationsAccessAssignments;
