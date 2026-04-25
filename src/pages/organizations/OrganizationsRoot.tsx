import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useCallback, useContext, useMemo } from "react";
import { NavLink, Outlet, To, useLocation } from "react-router";
import {
  myOrganizationPermissionOptions,
  organizationSafetyManagementPermissionOptions,
  organizationSettingsPermissionOptions,
  organizationTrainingManagementPermissionOptions,
  organizationUserPermissionOptions,
} from "../../constants/permission-options";
import { useAuth } from "../../contexts/auth/useAuth";
import {
  OrganizationsContext,
  OrganizationsContextProvider,
} from "../../contexts/organizations/organizations-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { NavigationItem } from "../../types/core";
import { Organization, Unit } from "../../types/entities";
import { classNames, humanizeSlug } from "../../utils/core";
import { labelsForPreset } from "../../utils/labels";
import { useNav } from "../../utils/navigation";
import { OrganizationStatusBadge } from "./components/OrganizationStatusBadge";

const OrganizationsRootInner: React.FC = () => {
  const { isGlobalAdmin } = useAuth();

  const {
    currentOrganization,
    currentOrganizationLoading,
    allUnits,
    currentUnit,
    currentUnitLoading,
    unitsPath,
    setUnitsPath,
    isUnitContext,
  } = useContext(OrganizationsContext);

  const paths = useMemo(() => unitsPath?.split("/") ?? [], [unitsPath]);

  const { search } = useLocation();
  const { canNavigate } = useNav();

  const unitSlugMap = useMemo(
    () =>
      allUnits?.reduce((acc, unit) => {
        acc.set(unit.slug, unit);
        return acc;
      }, new Map<string, Unit>()),
    [allUnits],
  );

  const topLevelUnits = useMemo(
    () =>
      allUnits?.filter((unit) => !unit.parentUnitId && !unit.isDefault) ?? [],
    [allUnits],
  );

  // Every path crumb is a sibling switcher. `siblingsAt(idx)` returns the
  // switchable set for the crumb at position `idx` — top-level units when
  // idx=0, otherwise children of the crumb one level up.
  const siblingsAt = useCallback(
    (idx: number) => {
      if (!allUnits) return [];
      if (idx === 0) return topLevelUnits;
      const parentSlug = paths[idx - 1];
      return allUnits.filter((u) => u.parentUnit?.slug === parentSlug);
    },
    [allUnits, topLevelUnits, paths],
  );

  // Children of the deepest crumb — populate the trailing "All {unitPlural}"
  // drilldown dropdown. At the root, these are the top-level units.
  const deepestChildren = useMemo(() => {
    if (!allUnits) return [];
    if (!isUnitContext) return topLevelUnits;
    const currentSlug = paths[paths.length - 1];
    return allUnits.filter((u) => u.parentUnit?.slug === currentSlug);
  }, [allUnits, isUnitContext, topLevelUnits, paths]);

  const labels = useMemo(
    () => labelsForPreset(currentOrganization?.labelPreset),
    [currentOrganization?.labelPreset],
  );

  const tabs = useMemo(
    () =>
      (
        [
          {
            // Users + Access merged under one tab. Sub-tabs
            // (Assignments / History) live inside the page. See
            // `_docs/users-access-merge-plan.md`.
            name: "Users",
            to: "users",
            icon: UsersIcon,
            permissionOptions: organizationUserPermissionOptions,
          },
          {
            name: labels.unitPlural,
            to: "units",
            icon: BuildingOffice2Icon,
          },
          {
            name: "TAT",
            to: "tat",
            icon: UserGroupIcon,
            permissionOptions: organizationSafetyManagementPermissionOptions,
          },
          {
            name: "Training",
            to: "training",
            icon: BookOpenIcon,
            hidden: !isGlobalAdmin || isUnitContext,
            permissionOptions: organizationTrainingManagementPermissionOptions,
          },
          {
            name: "Settings",
            to: "settings",
            icon: Cog6ToothIcon,
            permissionOptions: organizationSettingsPermissionOptions,
          },
        ] as (NavigationItem & { icon: typeof HomeIcon; hidden?: boolean })[]
      ).filter(canNavigate),
    [isUnitContext, isGlobalAdmin, canNavigate, labels.unitPlural],
  );

  return (
    <>
      <div className="space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="flex max-w-full overflow-x-scroll"
        >
          <ol role="list" className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <button
                  onClick={() => setUnitsPath(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="sr-only">My Organization</span>
                </button>
              </div>
            </li>
            {paths.map((path, idx) => {
              const siblings = siblingsAt(idx);
              const label = unitSlugMap?.get(path)?.name || humanizeSlug(path);
              // "All units" at position idx jumps back to the parent level —
              // idx=0 returns to org root (null), otherwise keep the prefix
              // up to but not including this crumb.
              const parentPath =
                idx === 0 ? null : paths.slice(0, idx).join("/");
              return (
                <li key={path}>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-gray-400"
                    />
                    <Menu as="div" className="relative ml-4">
                      <MenuButton className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                        {label}
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-4 text-gray-400"
                        />
                      </MenuButton>
                      <MenuItems
                        anchor={{ to: "bottom start", gap: 2 }}
                        className="z-20 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden max-h-[45vh] overflow-y-auto"
                      >
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              type="button"
                              onClick={() => setUnitsPath(parentPath)}
                              className={classNames(
                                focus
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-500",
                                "block w-full border-b border-gray-100 px-4 py-2 text-left text-sm",
                              )}
                            >
                              All {labels.unitPlural.toLowerCase()}
                            </button>
                          )}
                        </MenuItem>
                        {siblings.map((unit) => {
                          const isCurrent = unit.slug === path;
                          return (
                            <MenuItem key={unit.id}>
                              {({ focus }) => (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUnitsPath(unit.path ?? unit.slug)
                                  }
                                  className={classNames(
                                    focus
                                      ? "bg-gray-100 text-gray-900"
                                      : isCurrent
                                        ? "bg-gray-50 text-gray-900 font-medium"
                                        : "text-gray-700",
                                    "block w-full px-4 py-2 text-left text-sm",
                                  )}
                                >
                                  {unit.name}
                                </button>
                              )}
                            </MenuItem>
                          );
                        })}
                      </MenuItems>
                    </Menu>
                  </div>
                </li>
              );
            })}
            {deepestChildren.length > 0 && (
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-gray-400"
                  />
                  <Menu as="div" className="relative ml-4">
                    <MenuButton className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                      All {labels.unitPlural}
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="size-4 text-gray-400"
                      />
                    </MenuButton>
                    <MenuItems
                      anchor={{ to: "bottom start", gap: 2 }}
                      className="z-20 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden max-h-[45vh] overflow-y-auto"
                    >
                      {deepestChildren.map((unit) => (
                        <MenuItem key={unit.id}>
                          {({ focus }) => (
                            <button
                              type="button"
                              onClick={() =>
                                setUnitsPath(unit.path ?? unit.slug)
                              }
                              className={classNames(
                                focus
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700",
                                "block w-full px-4 py-2 text-left text-sm",
                              )}
                            >
                              {unit.name}
                            </button>
                          )}
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </li>
            )}
          </ol>
        </nav>
        <div>
          {(isUnitContext && currentUnitLoading) ||
          currentOrganizationLoading ? (
            <div className="animate-pulse rounded-sm bg-slate-200 w-full h-12" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold leading-6 text-gray-900 inline-flex items-center gap-2">
                {isUnitContext ? currentUnit?.name : currentOrganization?.name}
                {!isUnitContext && currentOrganization && isGlobalAdmin && (
                  <OrganizationStatusBadge
                    status={currentOrganization.status}
                  />
                )}
              </h1>
              {(() => {
                const address = isUnitContext
                  ? currentUnit?.address
                  : currentOrganization?.address;
                return address ? (
                  <p className="text-sm pt-2">{address}</p>
                ) : null;
              })()}
            </>
          )}
        </div>
        <div>
          <div className="max-w-full overflow-x-scroll">
            <div className="border-b border-gray-200">
              <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                {tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => (
                    <NavLink
                      key={tab.name}
                      to={{ pathname: tab.to, search }}
                      // aria-current={tab.current ? "page" : undefined}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "border-secondary-500 text-secondary-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                          "group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <tab.icon
                            aria-hidden="true"
                            className={classNames(
                              isActive
                                ? "text-secondary-500"
                                : "text-gray-400 group-hover:text-gray-500",
                              "-ml-0.5 mr-2 size-5",
                            )}
                          />
                          <span>{tab.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
              </nav>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            "mb-2 rounded-md text-white font-semibold text-xs py-2 px-3 bg-linear-to-r",
            isUnitContext
              ? "from-secondary-600 to-secondary-500"
              : "from-primary-600 to-primary-500",
          )}
        >
          {isUnitContext ? "Unit" : "Organization"}
        </div>
        <Outlet />
      </div>
    </>
  );
};

const OrganizationsRoot: React.FC<{
  organizationId?: Organization["id"];
  organizationDeleteRedirect?: To;
}> = withRequirePermissions(
  ({ organizationId, organizationDeleteRedirect }) => {
    return (
      <OrganizationsContextProvider
        currentOrganizationId={organizationId}
        organizationDeleteRedirect={organizationDeleteRedirect}
      >
        <OrganizationsRootInner />
      </OrganizationsContextProvider>
    );
  },
  myOrganizationPermissionOptions,
);

export default OrganizationsRoot;
