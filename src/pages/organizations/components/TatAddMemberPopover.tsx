/**
 * Small combobox popover for adding a user to the TAT at a given scope
 * (org-level when `unitId` is null, unit-level otherwise).
 *
 * Search is powered by `useUsersWithAccess` — the response carries each
 * candidate's existing grants, which we need for the replace-with-set
 * PATCH. Filters out users who are already on the TAT at this scope.
 */
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { UserPlusIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import Loader from "../../../components/layouts/Loader";
import { UserWithAccess } from "../../../queries/grants";
import {
  usePatchUserGrants,
  useUsersWithAccess,
} from "../../../queries/use-grants";

interface Props {
  orgId: string;
  /** null → adding to org-level TAT; otherwise the unit's id. */
  unitId: string | null;
  /** idpIds of users already on the TAT at this scope — hidden from results. */
  excludeIdpIds: Set<string>;
}

const formatUser = (u: UserWithAccess) => {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  const email = u.email ?? "";
  return name ? `${name} <${email}>` : email || u.idpId;
};

const TatAddMemberPopover: React.FC<Props> = ({
  orgId,
  unitId,
  excludeIdpIds,
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 250);

  const { data, isLoading } = useUsersWithAccess(orgId, {
    search: debouncedSearch || undefined,
    limit: 15,
  });

  const mutation = usePatchUserGrants(orgId);

  const candidates = useMemo(() => {
    const results = data?.results ?? [];
    return results.filter((u) => !excludeIdpIds.has(u.idpId) && !!u.userId);
  }, [data, excludeIdpIds]);

  const handleSelect = (user: UserWithAccess | null, close: () => void) => {
    if (!user || !user.userId) return;
    // Replace-with-set PATCH: preserve all existing grants, append the new
    // tat-member at this scope. Backend dedupes, but callers are expected
    // to send the full desired set.
    const next = user.grants.map((g) => ({
      roleSlug: g.roleSlug,
      unitId: g.unitId ?? undefined,
    }));
    next.push({ roleSlug: "tat-member", unitId: unitId ?? undefined });
    mutation.mutate(
      { userId: user.userId, grants: next },
      {
        onSuccess: () => {
          setSearch("");
          close();
        },
      },
    );
  };

  return (
    <Popover as={Fragment}>
      {({ open, close }) => (
        <>
          <PopoverButton
            as="button"
            type="button"
            className="inline-flex items-center gap-x-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            <UserPlusIcon className="size-4" />
            Add
          </PopoverButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel
                static
                anchor="bottom start"
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="z-30 w-[420px] rounded-lg bg-white shadow-lg ring-1 ring-black/5 [--anchor-gap:8px]"
              >
                <div className="p-4">
                  <Combobox
                    onClose={() => setSearch("")}
                    onChange={(u: UserWithAccess | null) =>
                      handleSelect(u, close)
                    }
                  >
                    <div className="relative">
                      <ComboboxInput
                        aria-label="Search users"
                        displayValue={() => ""}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
                      />
                      {(isLoading || mutation.isPending) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader className="size-5 text-gray-700" />
                        </div>
                      )}
                    </div>
                    <ComboboxOptions className="mt-2 max-h-64 overflow-auto rounded-md bg-white text-sm ring-1 ring-black/5 empty:invisible">
                      {candidates.map((u) => (
                        <ComboboxOption
                          key={u.idpId}
                          value={u}
                          className="cursor-pointer select-none px-3 py-2 text-gray-900 data-focus:bg-secondary-600 data-focus:text-white"
                        >
                          {formatUser(u)}
                        </ComboboxOption>
                      ))}
                      {debouncedSearch &&
                        !isLoading &&
                        candidates.length === 0 && (
                          <ComboboxOption
                            value={null}
                            disabled
                            className="cursor-default select-none px-3 py-2 italic text-gray-500"
                          >
                            No eligible users found.
                          </ComboboxOption>
                        )}
                    </ComboboxOptions>
                  </Combobox>
                  <p className="mt-2 text-xs text-gray-500">
                    Users who haven&rsquo;t logged in yet can&rsquo;t be added —
                    they must sign in once first.
                  </p>
                </div>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};

export default TatAddMemberPopover;
