/**
 * Role assignment surface for an organization. Replaces scattered
 * role-group controls (KC-backed) with a single DB-native editor.
 *
 * Table of users with their current org-level grants as chips; click a
 * row to open the slide-over editor. Mirrors the "warm professionalism"
 * direction set in .impeccable.md — no destructive red for routine
 * actions, generous row padding, plain language copy.
 */
import { useContext, useMemo, useState } from "react";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { UserWithGrants } from "../../../queries/grants";
import { useUsersWithGrants } from "../../../queries/use-grants";
import RoleAssignmentEditor from "../components/RoleAssignmentEditor";

/**
 * Order matters here — chips render in this order. "Highest privilege"
 * first so the most relevant badge reads left to right.
 */
const ROLE_DISPLAY_ORDER = [
  "system-admin",
  "organization-admin",
  "training-admin",
  "tat-member",
  "member",
];

const ROLE_LABELS: Record<string, string> = {
  "system-admin": "System Admin",
  "organization-admin": "Org Admin",
  "training-admin": "Training Admin",
  "tat-member": "TAT",
  member: "Member",
};

/**
 * Role chip color. Orange (primary) signals broad authority; secondary
 * blue for functional roles; neutral for TAT/member (not authority, just
 * participation). Avoid red — the app's brand intentionally steers clear
 * of urgency/alarm theater (see .impeccable.md).
 */
const ROLE_CHIP_CLASS: Record<string, string> = {
  "system-admin": "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "organization-admin":
    "bg-primary-100 text-primary-800 ring-1 ring-primary-200",
  "training-admin":
    "bg-secondary-100 text-secondary-800 ring-1 ring-secondary-200",
  "tat-member": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  member: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

const OrganizationsAccess: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading } =
    useContext(OrganizationsContext);
  const orgId = currentOrganization?.id;

  const { data: users, isLoading } = useUsersWithGrants(orgId);
  const [editing, setEditing] = useState<UserWithGrants | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!users) return [];
    if (!q) return users;
    return users.filter((u) => u.email?.toLowerCase().includes(q));
  }, [users, query]);

  if (currentOrganizationLoading || !currentOrganization) {
    return (
      <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Access</h2>
          <p className="text-sm text-gray-500">
            Assign roles to users in {currentOrganization.name}. Changes take
            effect immediately.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="w-64 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                >
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  {query
                    ? "No users match that search."
                    : "No users have grants yet. Add one to get started."}
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
                const sortedSlugs = [...orgSlugs].sort(
                  (a, b) =>
                    ROLE_DISPLAY_ORDER.indexOf(a) -
                    ROLE_DISPLAY_ORDER.indexOf(b),
                );
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setEditing(user)}
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
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                ROLE_CHIP_CLASS[slug] ??
                                "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                              }`}
                            >
                              {ROLE_LABELS[slug] ?? slug}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-500 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(user);
                        }}
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

      {orgId && (
        <RoleAssignmentEditor
          orgId={orgId}
          user={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default OrganizationsAccess;
