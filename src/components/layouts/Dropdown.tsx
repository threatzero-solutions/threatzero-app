import {
  flip,
  offset,
  Placement,
  useFloating,
  UseFloatingOptions,
} from "@floating-ui/react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Fragment, MouseEventHandler, ReactNode } from "react";
import { classNames } from "../../utils/core";

export interface DropdownAction {
  id: string | number;
  value: ReactNode;
  action?: MouseEventHandler<HTMLButtonElement>;
  hidden?: boolean;
  disabled?: boolean;
}

export interface DropdownActionGroup {
  id: string | number;
  value?: ReactNode;
  actions?: DropdownAction[];
  hidden?: boolean;
}

interface DropdownProps extends UseFloatingOptions {
  value?: string;
  valueIcon?: ReactNode;
  iconOnly?: boolean;
  actions?: DropdownAction[];
  actionGroups?: DropdownActionGroup[];
  className?: string;
  placement?: Placement;
  showDividers?: boolean;
  disabled?: boolean;
}

const Action: React.FC<{ action: DropdownAction }> = ({ action }) => {
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          type="button"
          disabled={action.disabled}
          onClick={action.disabled ? (e) => e.preventDefault() : action.action}
          className={classNames(
            focus && !action.disabled
              ? "bg-gray-100 text-gray-900"
              : "text-gray-700",
            "block w-full px-4 py-2 text-left text-sm"
          )}
        >
          {action.value}
        </button>
      )}
    </MenuItem>
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
  valueIcon,
  iconOnly,
  actions,
  actionGroups,
  className,
  placement = "bottom-end",
  showDividers,
  disabled,
  ...floatingProps
}) => {
  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), offset({ mainAxis: 8 })],
    placement,
    ...floatingProps,
  });

  return (
    <Menu
      as="div"
      className={classNames("relative inline-block text-left", className)}
      aria-disabled={disabled}
    >
      <MenuButton
        ref={refs.setReference}
        type="button"
        className={classNames(
          iconOnly
            ? "block p-1 text-gray-500 hover:text-gray-900 my-auto"
            : "inline-flex h-full w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        )}
        disabled={disabled}
      >
        {iconOnly ? <span className="sr-only">{value}</span> : value}
        {valueIcon ? (
          valueIcon
        ) : (
          <ChevronDownIcon
            className={classNames(
              "-mr-1 h-5 w-5 text-gray-400",
              value ? "" : "-ml-1"
            )}
            aria-hidden="true"
          />
        )}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          ref={refs.setFloating}
          style={floatingStyles}
          className={classNames(
            "z-20 pb-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden",
            "max-h-[45vh] overflow-y-auto",
            showDividers ? "divide-y divide-gray-100" : ""
          )}
          static={true}
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
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
