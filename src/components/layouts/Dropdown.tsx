import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Fragment, ReactNode } from "react";
import { classNames } from "../../utils/core";

export interface DropdownAction {
  id: string | number;
  value: ReactNode;
  action: () => void;
  hidden?: boolean;
  disabled?: boolean;
}

export interface DropdownActionGroup {
  id: string | number;
  value?: ReactNode;
  actions?: DropdownAction[];
  hidden?: boolean;
}

interface DropdownProps {
  value?: string;
  actions?: DropdownAction[];
  actionGroups?: DropdownActionGroup[];
  className?: string;
  openTo?: "left" | "right";
  showDividers?: boolean;
  disabled?: boolean;
}

const Action: React.FC<{ action: DropdownAction }> = ({ action }) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          disabled={action.disabled}
          onClick={action.action}
          className={classNames(
            active ? "bg-gray-100 text-gray-900" : "text-gray-700",
            "block w-full px-4 py-2 text-left text-sm"
          )}
        >
          {action.value}
        </button>
      )}
    </Menu.Item>
  );
};

const ActionGroup: React.FC<{ actionGroup: DropdownActionGroup }> = ({
  actionGroup,
}) => {
  return (
    <div className="py-1">
      {actionGroup.value && (
        <div className="px-4 pt-3">{actionGroup.value}</div>
      )}
      {actionGroup.actions
        ?.filter((a) => !a.hidden)
        .map((action) => (
          <Action key={action.id} action={action} />
        ))}
    </div>
  );
};

const Dropdown: React.FC<DropdownProps> = ({
  value,
  actions,
  actionGroups,
  className,
  openTo,
  showDividers,
  disabled,
}) => {
  return (
    <Menu
      as="div"
      className={classNames("relative inline-block text-left", className)}
      aria-disabled={disabled}
    >
      <Menu.Button
        type="button"
        className="inline-flex h-full w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        disabled={disabled}
      >
        {value}
        <ChevronDownIcon
          className={classNames(
            "-mr-1 h-5 w-5 text-gray-400",
            value ? "" : "-ml-1"
          )}
          aria-hidden="true"
        />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            "absolute z-20 mt-2 pb-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            openTo === "right"
              ? "origin-top-left left-0"
              : "origin-top-right right-0",
            showDividers ? "divide-y divide-gray-100" : ""
          )}
        >
          {!!actions && (
            <ActionGroup
              actionGroup={{
                id: "ungrouped-actions",
                actions: actions,
              }}
            />
          )}
          {actionGroups?.map((actionGroup) => (
            <ActionGroup key={actionGroup.id} actionGroup={actionGroup} />
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
