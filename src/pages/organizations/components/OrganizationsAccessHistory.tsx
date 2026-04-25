/**
 * Audit log for the Access surface. Paginated feed of grant/revoke
 * events scoped to the current organization, optionally filtered to a
 * single target user.
 *
 * Backend: GET /organizations/:orgId/access/audit
 * Columns: When, Actor, Target user, Action, Role, Scope, Reason.
 *
 * Pagination is server-driven (limit/offset) via the Paginator layout
 * component. Page size is local state; the data fetch is debounced by
 * React Query's own request deduplication, so no manual debounce here.
 */
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Paginator from "../../../components/layouts/Paginator";
import { GrantAuditEntry } from "../../../queries/grants";
import { useGrantAudit, useUsersWithAccess } from "../../../queries/use-grants";
import Select from "../../../components/forms/inputs/Select";
import { roleChipClass, roleLabel } from "./roleDisplay";

dayjs.extend(relativeTime);

interface Props {
  orgId: string;
  orgName: string;
}

const PAGE_SIZE_DEFAULT = 25;
const ALL_USERS_KEY = "__all__";

const OrganizationsAccessHistory: React.FC<Props> = ({ orgId, orgName }) => {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE_DEFAULT);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Load a large-ish first page purely to populate the user filter
  // dropdown. Paginating the dropdown is out of scope — real filtering
  // should come from search-as-you-type later. 500 covers any org we
  // have today without blowing up the request.
  const { data: usersPage } = useUsersWithAccess(orgId, { limit: 500 });
  const { data, isLoading, isFetching } = useGrantAudit(orgId, {
    userId,
    limit,
    offset,
  });

  const userOptions = useMemo(() => {
    const opts: Array<{ key: string; label: string }> = [
      { key: ALL_USERS_KEY, label: "All users" },
    ];
    for (const u of usersPage?.results ?? []) {
      if (!u.email || !u.userId) continue;
      opts.push({ key: u.userId, label: u.email });
    }
    return opts;
  }, [usersPage]);

  const entries: GrantAuditEntry[] = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <p className="text-sm text-gray-500">
            Recent grant and revoke events in {orgName}. Newest first.
          </p>
        </div>
        <div className="sm:w-64">
          <label htmlFor="history-user-filter" className="sr-only">
            Filter by user
          </label>
          <Select
            id="history-user-filter"
            value={userId ?? ALL_USERS_KEY}
            onChange={(e) => {
              const next =
                e.target.value === ALL_USERS_KEY ? undefined : e.target.value;
              setUserId(next);
              setOffset(0);
            }}
            options={userOptions}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <HeaderCell>When</HeaderCell>
              <HeaderCell>Actor</HeaderCell>
              <HeaderCell>Target</HeaderCell>
              <HeaderCell>Action</HeaderCell>
              <HeaderCell>Role</HeaderCell>
              <HeaderCell>Scope</HeaderCell>
              <HeaderCell>Reason</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  {userId
                    ? "No events recorded for this user."
                    : "No events recorded yet."}
                </td>
              </tr>
            ) : (
              entries.map((e) => <AuditRow key={e.id} entry={e} />)
            )}
          </tbody>
        </table>

        {data && data.count > 0 && (
          <Paginator
            count={data.count}
            limit={data.limit}
            offset={data.offset}
            pageCount={data.pageCount}
            setOffset={setOffset}
            setPageSize={(size) => {
              setLimit(size);
              setOffset(0);
            }}
          />
        )}
      </div>

      {isFetching && !isLoading && (
        <div className="text-xs text-gray-400" role="status" aria-live="polite">
          Refreshing…
        </div>
      )}
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

const AuditRow: React.FC<{ entry: GrantAuditEntry }> = ({ entry }) => {
  const when = dayjs(entry.createdOn);
  const roleSlug = entry.role?.slug;
  const scopeLabel = entry.unit?.name ?? "Organization";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        <div title={when.format("lll")}>{when.fromNow()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {entry.actor?.email ?? (
          <span className="italic text-gray-400">System</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {entry.user?.email ?? "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ActionBadge action={entry.action} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {roleSlug ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleChipClass(
              roleSlug,
            )}`}
          >
            {roleLabel(roleSlug)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {scopeLabel}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
        {entry.actorReason ?? <span className="italic text-gray-400">—</span>}
      </td>
    </tr>
  );
};

const ActionBadge: React.FC<{ action: GrantAuditEntry["action"] }> = ({
  action,
}) => {
  const granted = action === "granted";
  const classes = granted
    ? "bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200"
    : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}
    >
      {action}
    </span>
  );
};

export default OrganizationsAccessHistory;
