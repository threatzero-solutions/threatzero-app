import {
  BookOpenIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  LifebuoyIcon,
  PencilIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useContext, useMemo, useState } from "react";
import { NavLink, Outlet, To, useLocation } from "react-router";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import { myOrganizationPermissionOptions } from "../../constants/permission-options";
import { useAuth } from "../../contexts/auth/useAuth";
import {
  OrganizationsContext,
  OrganizationsContextProvider,
} from "../../contexts/organizations/organizations-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { Organization, Unit } from "../../types/entities";
import { classNames, humanizeSlug } from "../../utils/core";
import EditOrganizationBasic from "./components/EditOrganizationBasic";

const OrganizationsRootInner: React.FC = () => {
  const [editBasicInfoOpen, setEditBasicInfoOpen] = useState(false);

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
    invalidateCurrentUnitQuery,
    invalidateOrganizationQuery,
  } = useContext(OrganizationsContext);

  const paths = useMemo(() => unitsPath?.split("/") ?? [], [unitsPath]);

  const { search } = useLocation();

  const unitSlugMap = useMemo(
    () =>
      allUnits?.reduce((acc, unit) => {
        acc.set(unit.slug, unit);
        return acc;
      }, new Map<string, Unit>()),
    [allUnits]
  );

  const tabs = useMemo(
    () => [
      {
        name: "Units",
        to: "units",
        icon: BuildingOffice2Icon,
      },
      {
        name: "Users",
        to: "users",
        icon: UsersIcon,
      },
      {
        name: "Training",
        to: "training",
        icon: BookOpenIcon,
      },
      {
        name: "Safety",
        to: "safety",
        icon: LifebuoyIcon,
      },
      {
        name: "Settings",
        to: "settings",
        icon: Cog6ToothIcon,
        hidden: !isUnitContext && !isGlobalAdmin,
      },
    ],
    [isUnitContext, isGlobalAdmin]
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
            {paths.map((path, idx) => (
              <li key={path}>
                <div className="flex items-center">
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-gray-400"
                  />
                  <button
                    onClick={() =>
                      setUnitsPath(paths.slice(0, idx + 1).join("/"))
                    }
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    {unitSlugMap?.get(path)?.name || humanizeSlug(path)}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          {(isUnitContext && currentUnitLoading) ||
          currentOrganizationLoading ? (
            <div className="animate-pulse rounded bg-slate-200 w-full h-12" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold leading-6 text-gray-900 inline-flex items-center gap-2">
                {isUnitContext ? currentUnit?.name : currentOrganization?.name}
                <PencilIcon
                  onClick={() => setEditBasicInfoOpen(true)}
                  className="size-5 cursor-pointer text-gray-400 hover:text-gray-500"
                />
              </h1>
              <p className="text-sm pt-2">
                {(isUnitContext
                  ? currentUnit?.address
                  : currentOrganization?.address) || <span>&mdash;</span>}
              </p>
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
                          "group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium"
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
                              "-ml-0.5 mr-2 size-5"
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
            "mb-2 rounded-md text-white font-semibold text-xs py-2 px-3 bg-gradient-to-r",
            isUnitContext
              ? "from-secondary-600 to-secondary-500"
              : "from-primary-600 to-primary-500"
          )}
        >
          {isUnitContext ? "Unit" : "Organization"}
        </div>
        <Outlet />
      </div>
      {currentOrganization?.id && (
        <SlideOver open={editBasicInfoOpen} setOpen={setEditBasicInfoOpen}>
          <EditOrganizationBasic
            setOpen={setEditBasicInfoOpen}
            create={false}
            organizationId={currentOrganization.id}
            unitId={currentUnit?.id}
            level={isUnitContext ? "unit" : "organization"}
            onSaveSuccess={() =>
              isUnitContext
                ? invalidateCurrentUnitQuery()
                : invalidateOrganizationQuery()
            }
          />
        </SlideOver>
      )}
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
  myOrganizationPermissionOptions
);

export default OrganizationsRoot;
