import { NavLink, Outlet, useLocation } from "react-router";
import { classNames, humanizeSlug } from "../../utils/core";
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
import {
  MyOrganizationContext,
  MyOrganizationContextProvider,
} from "../../contexts/my-organization/my-organization-context";
import { useContext, useMemo, useState } from "react";
import { Unit } from "../../types/entities";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import EditOrganizationBasic from "./components/EditOrganizationBasic";
import { useAuth } from "../../contexts/auth/useAuth";

const MyOrganizationRootInner: React.FC = () => {
  const [editBasicInfoOpen, setEditBasicInfoOpen] = useState(false);

  const { isGlobalAdmin } = useAuth();

  const {
    myOrganization,
    myOrganizationLoading,
    allUnits,
    currentUnit,
    currentUnitLoading,
    unitsPath,
    setUnitsPath,
    isUnitContext,
  } = useContext(MyOrganizationContext);

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
        <nav aria-label="Breadcrumb" className="flex">
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
          {(isUnitContext && currentUnitLoading) || myOrganizationLoading ? (
            <div className="animate-pulse rounded bg-slate-200 w-full h-12" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold leading-6 text-gray-900 inline-flex items-center gap-2">
                {isUnitContext ? currentUnit?.name : myOrganization?.name}
                <PencilIcon
                  onClick={() => setEditBasicInfoOpen(true)}
                  className="size-5 cursor-pointer text-gray-400 hover:text-gray-500"
                />
              </h1>
              <p className="text-sm pt-2">
                {(isUnitContext
                  ? currentUnit?.address
                  : myOrganization?.address) || <span>&mdash;</span>}
              </p>
            </>
          )}
        </div>
        <div>
          <div className="grid grid-cols-1 sm:hidden">
            {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
            <select
              defaultValue={tabs.find((tab) => tab)?.name}
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-secondary-600"
            >
              {tabs
                .filter((tab) => !tab.hidden)
                .map((tab) => (
                  <option key={tab.name}>{tab.name}</option>
                ))}
            </select>
          </div>
          <div className="hidden sm:block">
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
      {myOrganization?.id && (
        <SlideOver open={editBasicInfoOpen} setOpen={setEditBasicInfoOpen}>
          <EditOrganizationBasic
            setOpen={setEditBasicInfoOpen}
            create={false}
            organizationId={myOrganization.id}
            unitId={currentUnit?.id}
            level={isUnitContext ? "unit" : "organization"}
          />
        </SlideOver>
      )}
    </>
  );
};

const MyOrganizationRoot: React.FC = () => {
  return (
    <MyOrganizationContextProvider>
      <MyOrganizationRootInner />
    </MyOrganizationContextProvider>
  );
};

export default MyOrganizationRoot;
