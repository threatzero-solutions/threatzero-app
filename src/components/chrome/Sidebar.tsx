/**
 * Primary nav rail. Fixed on lg+, drawer on mobile (the drawer is
 * driven externally by `Shell` which owns the open state — keeps the
 * hamburger that opens it co-located with the rest of the top bar).
 *
 * Design notes:
 * - warm-100 surface, border-r warm-200, no shadow. Sidebar earns its
 *   contrast from the surface delta against the warm-50 content; no
 *   need to lean on elevation.
 * - Wordmark sits in a tight h-14 strip up top. No PNG, no h-32 dead
 *   zone. The lockup component owns the typography; this file only
 *   places it.
 * - Single-open accordion: opening one Disclosure group closes its
 *   siblings. Route presence wins: on mount, the group containing the
 *   active route auto-opens, even if a sibling was previously open.
 * - Active item: warm-200/70 pill, primary-500 icon, secondary-900
 *   text, trailing primary-400 dot. No left-stripe border (banned),
 *   no lifted card (anti-carry from Variant B).
 * - Help Center sits pinned at the bottom under a hairline border.
 */
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useNav } from "../../utils/navigation";
import Wordmark from "../brand/Wordmark";
import { CaretRight, Close, Lifebuoy } from "./icons";
import { ChromeNavItem, CHROME_NAV, PhosphorIcon } from "./nav-config";

interface SidebarProps {
  /** Mobile drawer open state. Desktop ignores this; rail is always shown. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const linkClasses = ({ active, child }: { active: boolean; child?: boolean }) =>
  [
    "group w-full flex items-center gap-3 rounded-lg text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40",
    child ? "px-3 py-1.5 text-secondary-600" : "px-3 py-2",
    active
      ? "bg-warm-200/70 text-secondary-900 font-medium"
      : child
        ? "hover:bg-warm-200/40 hover:text-secondary-800"
        : "text-secondary-700 hover:bg-warm-200/40",
  ].join(" ");

const ItemIcon: React.FC<{ icon?: PhosphorIcon; active: boolean }> = ({
  icon: Icon,
  active,
}) =>
  Icon ? (
    <Icon
      size={20}
      weight="regular"
      className={
        active ? "text-primary-500 shrink-0" : "text-secondary-500 shrink-0"
      }
    />
  ) : null;

const NavList: React.FC<{
  items: ChromeNavItem[];
  pathname: string;
  openGroup: string | null;
  onToggleGroup: (name: string | null) => void;
  onNavigate?: () => void;
}> = ({ items, pathname, openGroup, onToggleGroup, onNavigate }) => (
  <ul className="space-y-0.5">
    {items.map((item) => {
      const isLeaf = !item.children?.length;
      if (isLeaf && item.to) {
        return (
          <li key={item.name}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => linkClasses({ active: isActive })}
            >
              {({ isActive }) => (
                <>
                  <ItemIcon icon={item.icon} active={isActive} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0"
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        );
      }
      const isOpen = openGroup === item.name;
      const groupActive = item.children!.some(
        (c) => c.to && pathname.startsWith(c.to),
      );
      return (
        <li key={item.name}>
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => onToggleGroup(isOpen ? null : item.name)}
            className={linkClasses({ active: groupActive && !isOpen })}
          >
            <ItemIcon icon={item.icon} active={groupActive} />
            <span className="flex-1 text-left">{item.name}</span>
            <CaretRight
              size={14}
              weight="bold"
              className={[
                "text-secondary-400 shrink-0 transition-transform duration-150",
                isOpen ? "rotate-90" : "",
              ].join(" ")}
              aria-hidden="true"
            />
          </button>
          {isOpen && (
            <ul className="mt-1 ml-9 mb-2 space-y-0.5">
              {item.children!.map((child) =>
                child.to ? (
                  <li key={child.name}>
                    <NavLink
                      to={child.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        linkClasses({ active: isActive, child: true })
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex-1 text-left">{child.name}</span>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </li>
      );
    })}
  </ul>
);

const SidebarBody: React.FC<{
  pathname: string;
  openGroup: string | null;
  onToggleGroup: (name: string | null) => void;
  onNavigate?: () => void;
}> = ({ pathname, openGroup, onToggleGroup, onNavigate }) => {
  const { canNavigate, filterByPermissions } = useNav();
  const items = useMemo(
    () =>
      (CHROME_NAV as ChromeNavItem[])
        .filter(canNavigate)
        .map(filterByPermissions) as ChromeNavItem[],
    [canNavigate, filterByPermissions],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark strip */}
      <div className="px-5 h-14 flex items-center shrink-0">
        <Wordmark size="md" />
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" className="flex-1 px-3 pb-4 overflow-y-auto">
        <NavList
          items={items}
          pathname={pathname}
          openGroup={openGroup}
          onToggleGroup={onToggleGroup}
          onNavigate={onNavigate}
        />
      </nav>

      {/* Help Center pinned at the bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-warm-200">
        <NavLink
          to="/help-center"
          onClick={onNavigate}
          className={({ isActive }) => linkClasses({ active: isActive })}
        >
          {({ isActive }) => (
            <>
              <Lifebuoy
                size={20}
                weight="regular"
                className={
                  isActive
                    ? "text-primary-500 shrink-0"
                    : "text-secondary-500 shrink-0"
                }
              />
              <span className="flex-1 text-left">Help Center</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { pathname } = useLocation();

  // Auto-open the group containing the active route. Route presence wins
  // over user-toggled state (per the brief). When the user clicks a
  // sibling group, we honor that; we only auto-set when the active route
  // changes to one not currently covered by `openGroup`.
  const groupForPath = useMemo<string | null>(() => {
    for (const item of CHROME_NAV) {
      if (item.children?.some((c) => c.to && pathname.startsWith(c.to))) {
        return item.name;
      }
    }
    return null;
  }, [pathname]);

  const [openGroup, setOpenGroup] = useState<string | null>(groupForPath);
  useEffect(() => {
    // When the active route belongs to a group, ensure that group is open.
    // Leaving alone otherwise — the user's last toggle persists.
    if (groupForPath) setOpenGroup(groupForPath);
  }, [groupForPath]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col bg-warm-100 border-r border-warm-200"
        aria-label="Sidebar"
      >
        <SidebarBody
          pathname={pathname}
          openGroup={openGroup}
          onToggleGroup={setOpenGroup}
        />
      </aside>

      {/* Mobile drawer */}
      <Transition show={mobileOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={onMobileClose}
        >
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-secondary-900/60" />
          </TransitionChild>

          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in duration-150 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 bg-warm-100">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="p-2.5 text-white"
                      onClick={onMobileClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <Close size={24} aria-hidden="true" />
                    </button>
                  </div>
                </TransitionChild>
                <SidebarBody
                  pathname={pathname}
                  openGroup={openGroup}
                  onToggleGroup={setOpenGroup}
                  onNavigate={onMobileClose}
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Sidebar;
