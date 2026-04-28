/**
 * System Administrators surface inside the Admin Panel.
 *
 * System-admin grants live here, deliberately separated from the
 * organization module so an org-admin session cannot accidentally fan
 * privilege out across tenants. The org-side role editor never offers
 * `system-admin` either — see `assertAssignerCanGrant` and
 * `listAssignableRoles`. Read-only display of system-admin status next
 * to org roles is the expected pattern; mutation lives only here.
 */
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useContext, useState } from "react";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import {
  grantSystemAdmin,
  listSystemAdmins,
  revokeSystemAdmin,
  SYSTEM_ADMINS_QUERY_KEY,
  SystemAdminEntry,
} from "../../../queries/system-admins";

dayjs.extend(relativeTime);

const initialsFor = (entry: SystemAdminEntry): string => {
  const parts = [entry.user.givenName, entry.user.familyName]
    .filter(Boolean)
    .map((part) => part!.trim()[0]?.toUpperCase())
    .filter(Boolean);
  if (parts.length) return parts.slice(0, 2).join("");
  return entry.user.email.slice(0, 1).toUpperCase();
};

const displayNameFor = (entry: SystemAdminEntry): string => {
  const joined = [entry.user.givenName, entry.user.familyName]
    .filter(Boolean)
    .join(" ");
  return joined || entry.user.email;
};

const sourceLabel: Record<SystemAdminEntry["source"], string> = {
  manual: "Granted in app",
  sso: "Provisioned by SSO",
  rule: "Granted by rule",
};

const SystemAdmins: React.FC = () => {
  const queryClient = useQueryClient();
  const { setError, setSuccess } = useContext(AlertContext);
  const { setOpen: setConfirmOpen, setClose: setConfirmClose } =
    useContext(ConfirmationContext);
  const { accessTokenClaims } = useAuth();
  const currentEmail = accessTokenClaims?.email
    ? String(accessTokenClaims.email).toLowerCase()
    : null;

  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: SYSTEM_ADMINS_QUERY_KEY,
    queryFn: listSystemAdmins,
  });

  const { mutate: grant, isPending: isGranting } = useMutation({
    mutationFn: (em: string) => grantSystemAdmin(em),
    onSuccess: (_res, em) => {
      setEmail("");
      setSuccess(`Granted system access to ${em}.`, { timeout: 4000 });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ADMINS_QUERY_KEY });
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Could not grant system access.";
      setError(msg);
    },
  });

  const { mutate: revoke } = useMutation({
    mutationFn: (userId: string) => revokeSystemAdmin(userId),
    onSuccess: () => {
      setSuccess("Revoked.", { timeout: 3000 });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ADMINS_QUERY_KEY });
      setConfirmClose();
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Could not revoke.";
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    grant(trimmed);
  };

  const handleRevoke = (entry: SystemAdminEntry) => {
    setConfirmOpen({
      title: "Revoke system administrator access",
      message: (
        <span>
          Remove the <span className="font-semibold">system administrator</span>{" "}
          role from
          <span className="block mt-1 font-medium text-gray-900">
            {displayNameFor(entry)}
          </span>
          <span className="block text-gray-500">{entry.user.email}</span>
          <span className="block mt-3 text-xs text-gray-500">
            They keep any organization-level roles they hold.
          </span>
        </span>
      ),
      onConfirm: () => revoke(entry.user.id),
      destructive: true,
      confirmText: "Revoke access",
    });
  };

  const entries = data ?? [];
  const manualEntries = entries.filter((e) => e.source === "manual");
  const externalEntries = entries.filter((e) => e.source !== "manual");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900">
          System administrators
        </h2>
        <p className="max-w-prose text-sm text-gray-600">
          Users with the system administrator role can read and edit every
          organization, manage rules, and grant any role. Keep this list small.
        </p>
      </header>

      <section className="rounded-lg bg-white p-5 ring-1 ring-gray-900/5">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="grow">
            <label
              htmlFor="grant-system-admin-email"
              className="block text-sm font-medium text-gray-900"
            >
              Grant access by email
            </label>
            <p className="mt-0.5 text-xs text-gray-500">
              The user must have signed in at least once.
            </p>
            <input
              id="grant-system-admin-email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-primary-600"
            />
          </div>
          <button
            type="submit"
            disabled={isGranting || !email.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-colors enabled:hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlusIcon className="size-4" aria-hidden="true" />
            {isGranting ? "Granting…" : "Grant access"}
          </button>
        </form>
      </section>

      <section className="rounded-lg bg-white ring-1 ring-gray-900/5">
        <header className="flex items-baseline justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Current administrators
          </h3>
          <span className="text-xs text-gray-500">
            {isLoading
              ? "Loading…"
              : `${entries.length} ${entries.length === 1 ? "person" : "people"}`}
          </span>
        </header>

        {isLoading ? (
          <div className="px-5 py-8 text-sm text-gray-500">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-warning-50 text-warning-600">
              <ExclamationTriangleIcon className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              No system administrators
            </p>
            <p className="max-w-sm text-sm text-gray-500">
              At least one administrator should exist so the platform stays
              manageable.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {[...manualEntries, ...externalEntries].map((entry) => {
              const isMe = currentEmail && currentEmail === entry.user.email;
              const canRevoke = entry.source === "manual" && !isMe;
              return (
                <li
                  key={entry.grantId}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 grow items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                      {initialsFor(entry)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {displayNameFor(entry)}
                        </span>
                        {isMe && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                            You
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {entry.user.email}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheckIcon
                            className="size-3.5 text-primary-500"
                            aria-hidden="true"
                          />
                          {sourceLabel[entry.source]}
                        </span>
                        <span title={dayjs(entry.grantedAt).format("LLL")}>
                          {dayjs(entry.grantedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center sm:justify-end">
                    {canRevoke ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(entry)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-danger-700 shadow-xs ring-1 ring-inset ring-danger-200 transition-colors hover:bg-danger-50 hover:ring-danger-300 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-danger-600"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span
                        className="text-xs italic text-gray-400"
                        title={
                          isMe
                            ? "You can't revoke your own access from here."
                            : entry.source === "sso"
                              ? "Provisioned by SSO. Edit upstream IDP to remove."
                              : "Granted by rule. Edit the rule to remove."
                        }
                      >
                        {isMe ? "Self" : "Read-only"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SystemAdmins;
