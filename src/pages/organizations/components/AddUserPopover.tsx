import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ReactNode, useEffect, useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import PillBadge from "../../../components/PillBadge";
import Loader from "../../../components/layouts/Loader";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { getOrganizationUsers } from "../../../queries/organizations";
import { OrganizationUser } from "../../../types/api";
import { classNames } from "../../../utils/core";

interface AddUserFormProps {
  onAddUsers?: (users: OrganizationUser[], close: () => void) => void;
  organizationId: string;
  unitSlug?: string;
  isPending?: boolean;
  appendQuery?: ItemFilterQueryParams;
  close: () => void;
}

interface AddUserPopoverProps extends Omit<AddUserFormProps, "close"> {
  button: ReactNode;
}

const formatUser = (user: OrganizationUser | undefined | null) => {
  return user
    ? `${user.firstName} ${user.lastName} <${user.email}>`.trim()
    : "";
};

const AddUserForm: React.FC<AddUserFormProps> = ({
  onAddUsers = () => {},
  organizationId,
  unitSlug,
  isPending = false,
  appendQuery = {},
  close,
}) => {
  const [selectedUsers, setSelectedUsers] = useImmer<OrganizationUser[]>([]);
  const [query, setQuery] = useImmer("");
  const [debouncedQuery] = useDebounceValue(query, 300);
  const { data: userResults, isLoading: usersLoading } = useQuery({
    queryKey: [
      "organizations-users",
      organizationId,
      {
        ...appendQuery,
        search: debouncedQuery,
        unit: unitSlug,
        limit: 20,
      },
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationUsers(queryKey[1], queryKey[2]),
  });

  const users = useMemo(
    () =>
      (userResults?.results ?? []).filter(
        (u) => selectedUsers.findIndex((su) => su.id === u.id) === -1
      ),
    [userResults, selectedUsers]
  );

  useEffect(() => {
    return () => {
      setSelectedUsers([]);
      setQuery("");
    };
  }, [setSelectedUsers, setQuery]);

  const handleToggleUser = (user: OrganizationUser | null) => {
    if (!user) return;
    if (selectedUsers.findIndex((u) => u.id === user.id) > -1) {
      setSelectedUsers((draft) => draft.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((draft) => [...draft, user]);
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-base font-semibold leading-6 text-gray-900">
        Search Users to Add
      </h3>
      <div className="mt-2 max-w-md text-sm text-gray-500">
        <p>Enter user name or email to search and add.</p>
      </div>
      <div className="mt-5 flex flex-col gap-4 w-full">
        <div className="w-full space-y-2">
          <label htmlFor="idp-alias" className="sr-only">
            User Search
          </label>
          <Combobox onClose={() => setQuery("")} onChange={handleToggleUser}>
            <div className="relative w-full">
              <ComboboxInput
                aria-label="Assignee"
                displayValue={() => ""}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email..."
                className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
              />
              {usersLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="size-5 text-gray-700" />
                </div>
              )}
            </div>
            <ComboboxOptions
              anchor="bottom start"
              className="empty:invisible mt-1 rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden sm:text-sm"
            >
              {users.map((user) => (
                <ComboboxOption
                  key={user.id}
                  value={user}
                  className="relative cursor-default select-none py-2 px-3 text-gray-900 data-focus:bg-secondary-600 data-focus:text-white"
                >
                  {formatUser(user)}
                </ComboboxOption>
              ))}
              {query && users.length === 0 && (
                <ComboboxOption
                  value={null}
                  disabled
                  className="relative cursor-default select-none py-2 px-3 text-gray-900"
                >
                  No users found.
                </ComboboxOption>
              )}
            </ComboboxOptions>
          </Combobox>
          <div className="flex gap-2 flex-col items-start">
            {selectedUsers.map((user) => (
              <PillBadge
                key={user.id}
                value={user}
                displayValue={formatUser(user)}
                color="blue"
                isRemovable={true}
                onRemove={() => handleToggleUser(user)}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAddUsers(selectedUsers, close)}
          className={classNames(
            "inline-flex w-full items-center justify-center rounded-md transition-colors bg-secondary-600 disabled:opacity-50 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 sm:w-auto",
            isPending ? "animate-pulse" : ""
          )}
          disabled={selectedUsers.length === 0 || isPending}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const AddUserPopover: React.FC<AddUserPopoverProps> = ({
  button,
  ...props
}) => {
  return (
    <Popover as={Fragment}>
      {({ open, close }) => (
        <>
          <PopoverButton as={Fragment}>{button}</PopoverButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel
                className="bg-white shadow-sm sm:rounded-lg [--anchor-gap:8px] w-[600px]"
                anchor="bottom start"
                static
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <AddUserForm {...props} close={close} />
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};

export default AddUserPopover;
