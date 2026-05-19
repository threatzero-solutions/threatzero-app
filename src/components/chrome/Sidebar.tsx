/**
 * Primary nav rail. Fixed on lg+, drawer on mobile (the drawer is
 * driven externally by `Shell` which owns the open state).
 *
 * Design notes:
 * - warm-100 surface, border-r warm-200, no shadow. Sidebar earns its
 *   contrast from the surface delta against the warm-50 content; no
 *   need to lean on elevation.
 * - Real TZ_logo at h-14 in the header strip, sized so the wordmark
 *   and the SOLUTIONS subline are both legible.
 * - Items are organized into sections. The top section has no title
 *   (it's what training participants see); subsequent sections carry
 *   small uppercase typographic headers. A section hides entirely
 *   when no items pass the user's permission filter.
 * - SOS CTA below the last nav section: a distinct primary-orange
 *   panel with "S.O.S." and the "Sense · Observe · Share" tagline.
 *   Replaces the old "Share a Safety Concern" nav item with a real
 *   call to action.
 * - Active item: warm-200/70 pill, primary-500 icon, secondary-900
 *   text, trailing primary-400 dot. No left-stripe border (banned),
 *   no lifted card.
 * - Help Center sits pinned at the bottom under a hairline border.
 */
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useNav } from "../../utils/navigation";
import Logo from "../brand/Logo";
import { ArrowUpRight } from "@phosphor-icons/react";
import { CaretRight, Close, Lifebuoy } from "./icons";
import {
  ChromeNavItem,
  ChromeNavSection,
  CHROME_NAV,
  PhosphorIcon,
} from "./nav-config";

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

const SectionItem: React.FC<{
  item: ChromeNavItem;
  pathname: string;
  openGroup: string | null;
  onToggleGroup: (name: string | null) => void;
  onNavigate?: () => void;
}> = ({ item, pathname, openGroup, onToggleGroup, onNavigate }) => {
  const hasChildren = !!item.children?.length;
  if (!hasChildren && item.to) {
    return (
      <li>
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
    <li>
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
};

const SosCallout: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  // Quieter hover: no surface lift, no compound icon motion. The only
  // moving piece is the arrow gliding right ~3px on a slower curve, so
  // the eye reads "go this way" instead of "button pops". The surface
  // warms from warm-50 to warm-100 (not white — too stark) and the
  // ring shifts to primary-300 (not 400 — less saturated). Arrow
  // trails the surface by ~80ms so the motion reads as flow.
  <Link
    to="/safety-concerns"
    onClick={onNavigate}
    aria-label="Report a safety concern. Sense, observe, share."
    className={[
      "group block mx-3 mt-4 rounded-xl px-4 py-3.5",
      "bg-warm-50 ring-1 ring-warm-300",
      "hover:bg-warm-100 hover:ring-primary-300",
      "transition-[background-color,box-shadow] duration-[280ms]",
      "ease-[cubic-bezier(0.22,1,0.36,1)]",
      "motion-reduce:transition-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "focus-visible:ring-offset-warm-100 focus-visible:ring-primary-500",
    ].join(" ")}
  >
    <div className="space-y-0.5">
      {(
        [
          ["S", "ENSE"],
          ["O", "BSERVE"],
          ["S", "HARE"],
        ] as const
      ).map(([head, tail], i) => (
        <div
          key={i}
          className="flex items-baseline gap-[0.3em] text-[0.875rem] leading-tight"
        >
          <span className="font-bold text-primary-600 tracking-[0.05em]">
            {head}
          </span>
          <span className="font-medium tracking-[0.18em] text-secondary-800">
            {tail}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-2.5 pt-2 border-t border-warm-200 flex items-center justify-between gap-2">
      <span className="text-[0.6875rem] text-secondary-600">
        Report a concern
      </span>
      <ArrowUpRight
        size={14}
        weight="bold"
        className={[
          "text-secondary-500 shrink-0",
          "transition-[transform,color] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          "group-hover:text-primary-600 group-hover:translate-x-[3px]",
          "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0",
        ].join(" ")}
        aria-hidden="true"
      />
    </div>
  </Link>
);

const SidebarBody: React.FC<{
  pathname: string;
  openGroup: string | null;
  onToggleGroup: (name: string | null) => void;
  onNavigate?: () => void;
}> = ({ pathname, openGroup, onToggleGroup, onNavigate }) => {
  const { canNavigate, filterByPermissions } = useNav();

  const sections = useMemo<ChromeNavSection[]>(() => {
    return CHROME_NAV.map((section) => {
      // Run permission filter on the items inside the section.
      const items = (section.items as ChromeNavItem[])
        .filter(canNavigate)
        .map(filterByPermissions) as ChromeNavItem[];
      return { ...section, items };
    }).filter((section) => {
      // Drop the section if its own gate fails OR no items survived.
      // `canNavigate` only consults `permissionOptions`; the cast lets
      // us reuse the helper without inventing a fake `name`.
      if (
        section.permissionOptions &&
        !canNavigate({
          name: section.title ?? "",
          permissionOptions: section.permissionOptions,
        })
      ) {
        return false;
      }
      return section.items.length > 0;
    });
  }, [canNavigate, filterByPermissions]);

  return (
    <div className="flex h-full flex-col">
      {/* Logo strip */}
      <div className="px-5 h-20 flex items-center shrink-0">
        <Logo size="md" variant="lockup" className="h-14 w-auto" />
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" className="flex-1 px-3 pb-4 overflow-y-auto">
        <div className="space-y-5">
          {sections.map((section, idx) => (
            <div key={section.title ?? `section-${idx}`}>
              {section.title && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-500">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <SectionItem
                    key={item.name}
                    item={item}
                    pathname={pathname}
                    openGroup={openGroup}
                    onToggleGroup={onToggleGroup}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* SOS callout — distinct from regular nav, always visible. */}
        <SosCallout onNavigate={onNavigate} />
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

  // Auto-open the Disclosure group containing the active route (the
  // only group with a Disclosure is currently "Resources"). Route
  // presence wins over user-toggled state.
  const groupForPath = useMemo<string | null>(() => {
    for (const section of CHROME_NAV) {
      for (const item of section.items) {
        if (item.children?.some((c) => c.to && pathname.startsWith(c.to))) {
          return item.name;
        }
      }
    }
    return null;
  }, [pathname]);

  const [openGroup, setOpenGroup] = useState<string | null>(groupForPath);
  useEffect(() => {
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
              <DialogPanel className="relative flex w-64 bg-warm-100">
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
