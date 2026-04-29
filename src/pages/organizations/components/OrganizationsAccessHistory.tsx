/**
 * Audit log for the Access surface. A compact, row-oriented feed of
 * grant/revoke events for the current organization, sorted most-recent
 * first. Replaces an earlier wide table — the admin only cares about
 * "what changed, who changed it, when, and why", and rows read that
 * faster than cells.
 *
 * Backend: GET /organizations/:orgId/access/audit
 * Pagination is server-driven; page size is local state.
 *
 * The user filter is a searchable combobox that queries the initial
 * `useUsersWithAccess` page — enough to cover any org we have today.
 * Real search-as-you-type can replace this when org sizes justify it.
 */
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import Paginator from "../../../components/layouts/Paginator";
import { GrantAuditEntry } from "../../../queries/grants";
import { useGrantAudit, useUsersWithAccess } from "../../../queries/use-grants";
import { cn } from "../../../utils/core";
import { roleChipClass } from "./roleDisplay";

dayjs.extend(relativeTime);

interface Props {
  orgId: string;
}

const PAGE_SIZE_DEFAULT = 25;

interface UserOption {
  userId: string;
  email: string;
}

const OrganizationsAccessHistory: React.FC<Props> = ({ orgId }) => {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE_DEFAULT);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [userQuery, setUserQuery] = useState("");

  const { data: usersPage } = useUsersWithAccess(orgId, { limit: 500 });
  const { data, isLoading, isFetching } = useGrantAudit(orgId, {
    userId: selectedUser?.userId,
    limit,
    offset,
  });

  const userOptions = useMemo<UserOption[]>(() => {
    const opts: UserOption[] = [];
    for (const u of usersPage?.results ?? []) {
      if (!u.email || !u.userId) continue;
      opts.push({ userId: u.userId, email: u.email });
    }
    opts.sort((a, b) => a.email.localeCompare(b.email));
    return opts;
  }, [usersPage]);

  const filteredUserOptions = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter((u) => u.email.toLowerCase().includes(q));
  }, [userOptions, userQuery]);

  const entries: GrantAuditEntry[] = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Combobox<UserOption | null>
            immediate
            value={selectedUser}
            onChange={(v) => {
              setSelectedUser(v);
              setOffset(0);
            }}
          >
            <div className="relative">
              <ComboboxInput
                aria-label="Filter by user"
                placeholder="Filter by user — all users"
                className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-16 text-sm text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600"
                onChange={(e) => setUserQuery(e.target.value)}
                displayValue={(u: UserOption | null) => u?.email ?? ""}
              />
              {selectedUser && (
                <button
                  type="button"
                  aria-label="Clear user filter"
                  onClick={() => {
                    setSelectedUser(null);
                    setUserQuery("");
                    setOffset(0);
                  }}
                  className="absolute inset-y-0 right-7 flex items-center px-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="size-4" />
                </button>
              )}
              <ComboboxButton
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400"
                aria-label="Open user list"
              >
                <ChevronUpDownIcon className="size-4" />
              </ComboboxButton>
            </div>
            <ComboboxOptions
              anchor={{ to: "bottom start", gap: 4 }}
              className="z-30 w-[var(--input-width)] rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden max-h-[45vh] overflow-y-auto"
            >
              {filteredUserOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">
                  No matching users.
                </div>
              ) : (
                filteredUserOptions.map((u) => (
                  <ComboboxOption
                    key={u.userId}
                    value={u}
                    className={({ focus, selected }) =>
                      cn(
                        "cursor-default px-3 py-2",
                        focus
                          ? "bg-secondary-600 text-white"
                          : selected
                            ? "bg-gray-50 font-medium text-gray-900"
                            : "text-gray-700",
                      )
                    }
                  >
                    {u.email}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Combobox>
        </div>
        {isFetching && !isLoading && (
          <span
            className="text-xs text-gray-400"
            role="status"
            aria-live="polite"
          >
            Refreshing…
          </span>
        )}
      </div>

      <ol
        data-testid="change-log-list"
        className="divide-y divide-gray-100 rounded-lg bg-white ring-1 ring-gray-900/5"
      >
        {isLoading ? (
          <li
            className="px-4 py-8 text-center text-sm text-gray-500"
            role="status"
            aria-live="polite"
          >
            Loading…
          </li>
        ) : entries.length === 0 ? (
          <li
            className="px-4 py-8 text-center text-sm text-gray-500"
            role="status"
            aria-live="polite"
          >
            {selectedUser
              ? "No events recorded for this user."
              : "No events recorded yet."}
          </li>
        ) : (
          entries.map((e) => <AuditRow key={e.id} entry={e} />)
        )}
      </ol>

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
  );
};

const AuditRow: React.FC<{ entry: GrantAuditEntry }> = ({ entry }) => {
  const when = dayjs(entry.createdOn);
  const granted = entry.action === "granted";
  const actionColor = granted ? "text-secondary-700" : "text-gray-600";
  const actionWord = granted ? "granted" : "revoked";

  const targetEmail = entry.user?.email ?? "—";
  const actorEmail = entry.actor?.email ?? null;
  const roleSlug = entry.role?.slug ?? null;
  const roleName = entry.role?.name ?? roleSlug ?? "—";
  const scopeLabel = entry.unit?.name ?? "Organization";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-snug text-gray-900">
          <span className={cn("font-semibold", actionColor)}>{actionWord}</span>{" "}
          {roleSlug && roleName ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium align-baseline",
                roleChipClass(roleSlug),
              )}
            >
              {roleName}
            </span>
          ) : (
            <span className="text-xs text-gray-400">(unknown role)</span>
          )}{" "}
          for <span className="font-medium text-gray-900">{targetEmail}</span>{" "}
          at <span className="text-gray-700">{scopeLabel}</span>
        </p>
        {entry.actorReason && (
          <p className="text-xs italic text-gray-600">“{entry.actorReason}”</p>
        )}
        <p className="text-xs text-gray-500">
          by{" "}
          {actorEmail ? (
            <span className="text-gray-700">{actorEmail}</span>
          ) : (
            <span className="italic text-gray-400">System</span>
          )}
        </p>
      </div>
      <time
        dateTime={when.toISOString()}
        title={when.format("lll")}
        className="shrink-0 text-xs tabular-nums text-gray-500"
      >
        {when.fromNow()}
      </time>
    </li>
  );
};

export default OrganizationsAccessHistory;
