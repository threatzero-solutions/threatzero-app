import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { MouseEventHandler, ReactNode } from "react";
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

/**
 * Headless UI's `anchor` accepts either `"bottom-end"` style strings or
 * `"bottom end"`. We standardize call sites on the hyphenated form (matches
 * the Floating UI naming we used previously) and translate at the boundary.
 */
type DropdownPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

interface DropdownProps {
  value?: ReactNode;
  valueIcon?: ReactNode;
  iconOnly?: boolean;
  actions?: DropdownAction[];
  actionGroups?: DropdownActionGroup[];
  className?: string;
  /** Override the trigger button's class list (e.g. to use brand colors). */
  buttonClassName?: string;
  placement?: DropdownPlacement;
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
            "block w-full px-4 py-2 text-left text-sm",
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

/**
 * Map our hyphenated placement to the `to` syntax Headless UI's anchor
 * positioning expects. The default `bottom-end` reads as "the menu's
 * top-right corner aligns with the button's bottom-right corner."
 */
const toAnchor = (p: DropdownPlacement) =>
  p.replace("-", " ") as
    | "bottom end"
    | "bottom start"
    | "bottom"
    | "top end"
    | "top start"
    | "top"
    | "left"
    | "right";

/**
 * Pick a CSS transform-origin so the open animation grows out of the
 * corner closest to the trigger button rather than from the menu's
 * center. Without this the menu would visibly slide as it scales.
 */
const originFor = (p: DropdownPlacement): string => {
  switch (p) {
    case "top":
    case "top-start":
      return "origin-bottom-left";
    case "top-end":
      return "origin-bottom-right";
    case "bottom":
    case "bottom-start":
      return "origin-top-left";
    case "bottom-end":
      return "origin-top-right";
    case "left":
      return "origin-right";
    case "right":
      return "origin-left";
  }
};

const Dropdown: React.FC<DropdownProps> = ({
  value,
  valueIcon,
  iconOnly,
  actions,
  actionGroups,
  className,
  buttonClassName,
  placement = "bottom-end",
  showDividers,
  disabled,
}) => {
  return (
    <Menu
      as="div"
      className={classNames("relative inline-block text-left", className)}
      aria-disabled={disabled}
    >
      <MenuButton
        type="button"
        className={
          buttonClassName ??
          classNames(
            iconOnly
              ? "block p-1 text-gray-500 hover:text-gray-900 my-auto"
              : "inline-flex h-full w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
          )
        }
        disabled={disabled}
      >
        {iconOnly ? <span className="sr-only">{value}</span> : value}
        {valueIcon ? (
          valueIcon
        ) : (
          <ChevronDownIcon
            className={classNames(
              "-mr-1 h-5 w-5 text-gray-400",
              value ? "" : "-ml-1",
            )}
            aria-hidden="true"
          />
        )}
      </MenuButton>

      {/*
       * Letting Headless UI own both positioning (`anchor`) and the
       * open/close transition (`transition` + data-closed:* classes) fixes
       * the "menu flies in from the page corner" bug: it applies the
       * floating coordinates to the panel BEFORE any transition class
       * paint, so the open animation only ever scales+fades at the final
       * anchor point. Going through our own `useFloating` + a Headless UI
       * Transition wrapper put Tailwind's transform-based `scale-*` in a
       * fight with Floating UI's inline `transform: translate(...)`, and
       * the first paint landed at document origin. Same root cause as
       * 2610f25 but the previous fix only narrowed the window — it never
       * closed it.
       */}
      <MenuItems
        anchor={{ to: toAnchor(placement), gap: 8 }}
        transition
        portal
        className={classNames(
          "z-20 w-56 pb-2 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden",
          "max-h-[45vh] overflow-y-auto",
          originFor(placement),
          "transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 data-leave:duration-75 data-leave:ease-in",
          showDividers ? "divide-y divide-gray-100" : "",
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
      </MenuItems>
    </Menu>
  );
};

export default Dropdown;
