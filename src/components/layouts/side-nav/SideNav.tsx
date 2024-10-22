import React, { Fragment, useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  LifebuoyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import UserMenu from "../../UserMenu";
import SideNavLink from "./SideNavLink";
import { NavigationItem } from "../../../types/core";
import { CoreContext } from "../../../contexts/core/core-context";
import { NavLink } from "react-router-dom";
import { classNames } from "../../../utils/core";
import { useAuth } from "../../../contexts/AuthProvider";
import { useNav } from "../../../utils/navigation";
import {
  trainingLibraryPermissionsOptions,
  safetyManagementPermissionOptions,
  safetyConcernPermissionsOptions,
  threatAssessmentPermissionsOptions,
  violentIncidentReportPermissionsOptions,
  trainingAdminPermissionOptions,
  resourcePermissionsOptions,
  adminPanelPermissionOptions,
  // myOrganizationPermissionOptions,
} from "../../../constants/permission-options";

const INITIAL_NAVIGATION: NavigationItem[] = [
  {
    name: "My Dashboard",
    to: "/dashboard",
  },
  {
    name: "Training Library",
    to: "/training/library",
    permissionOptions: trainingLibraryPermissionsOptions,
  },
  {
    name: "Share a Safety Concern",
    to: "/safety-concerns",
  },
  {
    name: "Safety Management",
    permissionOptions: safetyManagementPermissionOptions,
    children: [
      // {
      //   name: "POC Files",
      //   href: "/safety-management/poc-files",
      // },
      {
        name: "Safety Concerns",
        to: "/safety-management/safety-concerns",
        permissionOptions: safetyConcernPermissionsOptions,
      },
      {
        name: "Threat Assessments",
        to: "/safety-management/threat-assessments",
        permissionOptions: threatAssessmentPermissionsOptions,
      },
      {
        name: "Violent Incident Log",
        to: "/safety-management/violent-incident-reports",
        permissionOptions: violentIncidentReportPermissionsOptions,
      },
      {
        name: "Training Admin",
        to: "/safety-management/training-admin",
        permissionOptions: trainingAdminPermissionOptions,
      },
    ],
  },
  {
    name: "Additional Resources",
    permissionOptions: resourcePermissionsOptions,
    children: [
      {
        name: "Prevention",
        to: "/resources/prevention",
      },
      {
        name: "Preparation",
        to: "/resources/preparation",
      },
      {
        name: "Response",
        to: "/resources/response",
      },
      {
        name: "Resiliency",
        to: "/resources/resiliency",
      },
    ],
  },
  {
    name: "Admin Panel",
    to: "/admin-panel",
    permissionOptions: adminPanelPermissionOptions,
  },
  // {
  //   name: "My Organization",
  //   to: "/my-organization",
  //   permissionOptions: myOrganizationPermissionOptions,
  // },
];

const HelpCenterLink: React.FC = () => {
  return (
    <NavLink
      to="/help-center"
      className={({ isActive }) =>
        classNames(
          isActive
            ? "bg-gray-50 text-secondary-600 hover:text-secondary-500 transition-colors"
            : "text-gray-700 hover:bg-gray-50 hover:text-secondary-400 transition-colors",
          "group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
        )
      }
    >
      <LifebuoyIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
      Help Center
    </NavLink>
  );
};

export default function SideNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { dispatch, state } = useContext(CoreContext);
  const { interceptorReady } = useAuth();
  const { filterByPermissions, canNavigate } = useNav();

  useEffect(() => {
    if (!interceptorReady) {
      return;
    }

    dispatch({
      type: "SET_MAIN_NAVIGATION_ITEMS",
      payload: INITIAL_NAVIGATION.filter(canNavigate).map(filterByPermissions),
    });
  }, [interceptorReady, filterByPermissions, canNavigate, dispatch]);

  return (
    <>
      <div>
        <Transition show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-40 lg:hidden"
            onClose={setSidebarOpen}
          >
            <TransitionChild
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </TransitionChild>

            <div className="fixed inset-0 flex">
              <TransitionChild
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </TransitionChild>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                      <img
                        className="h-8 w-auto"
                        src="/TZ_logo.png"
                        alt="ThreatZero Logo"
                      />
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul className="-mx-2 space-y-1">
                            {state.mainNavigationItems.map((item, idx) => (
                              <SideNavLink key={idx} item={item} />
                            ))}
                          </ul>
                        </li>
                        <ul className="mt-auto">
                          <li className="mt-auto">
                            <HelpCenterLink />
                          </li>
                        </ul>
                      </ul>
                    </nav>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:w-72 lg:flex-col bg-white">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 px-6 pb-4">
            <div className="flex h-32 shrink-0 items-center justify-center">
              <img
                className="h-20 w-auto"
                src="/TZ_logo.png"
                alt="ThreatZero Logo"
              />
            </div>
            <nav className="flex flex-1 flex-col bg-gray">
              <ul className="flex flex-1 flex-col gap-y-7 pb-4">
                <li>
                  <ul className="-mx-2 space-y-1">
                    {state.mainNavigationItems.map((item, idx) => (
                      <SideNavLink key={idx} item={item} />
                    ))}
                  </ul>
                </li>
                <ul className="mt-auto">
                  <li className="mt-auto">
                    <HelpCenterLink />
                  </li>
                </ul>
              </ul>
            </nav>
          </div>
        </div>

        <div className="snap-start">
          <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-start gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="grow"></div>
            <UserMenu />
          </div>
        </div>
      </div>
    </>
  );
}
