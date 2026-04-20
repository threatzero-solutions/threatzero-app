/**
 * Assignments sub-tab of the Access surface. Table of users with their
 * current org-level grants as chips; click Edit to open the slide-over
 * editor. Mirrors the "warm professionalism" direction set in
 * .impeccable.md — no destructive red for routine actions, generous row
 * padding, plain language copy.
 */
import { useMemo, useState } from "react";
import { UserWithGrants } from "../../../queries/grants";
import { useUsersWithGrants } from "../../../queries/use-grants";
import RoleAssignmentEditor from "./RoleAssignmentEditor";
import { roleChipClass, roleLabel, sortRoleSlugs } from "./roleDisplay";

interface Props {
  orgId: string;
  orgName: string;
}

const OrganizationsAccessAssignments: React.FC<Props> = ({
  orgId,
  orgName,
}) => {
  const { data: users, isLoading } = useUsersWithGrants(orgId);
  const [editing, setEditing] = useState<UserWithGrants | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!users) return [];
    if (!q) return users;
    return users.filter((u) => u.email?.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Access</h2>
          <p className="text-sm text-gray-500">
            Assign roles to users in {orgName}. Changes take effect immediately.
          </p>
        </div>
        <div>
          <label htmlFor="access-search" className="sr-only">
            Search users by email
          </label>
          <input
            id="access-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email"
            className="w-full sm:w-64 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Roles
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  {query
                    ? "No users match that search."
                    : "No users in this organization yet."}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const orgSlugs = user.grants
                  .filter((g) => g.unitId == null)
                  .map((g) => g.roleSlug);
                const unitCount = user.grants.filter(
                  (g) => g.unitId != null,
                ).length;
                const sortedSlugs = sortRoleSlugs(orgSlugs);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email ?? "—"}
                      </div>
                      {unitCount > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          + {unitCount} unit-scoped{" "}
                          {unitCount === 1 ? "grant" : "grants"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5">
                        {sortedSlugs.length === 0 ? (
                          <span className="text-xs italic text-gray-400">
                            No organization-wide roles
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        type="button"
                        aria-label={`Edit roles for ${user.email ?? "user"}`}
                        className="inline-flex items-center rounded-md px-3 py-2 text-primary-600 hover:text-primary-500 hover:bg-primary-50 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                        onClick={() => setEditing(user)}
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

      <RoleAssignmentEditor
        orgId={orgId}
        user={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
};

export default OrganizationsAccessAssignments;
