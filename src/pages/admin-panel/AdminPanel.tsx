import { LEVEL } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../utils/core";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { name: "Training", to: "training" },
  { name: "Organizations", to: "organizations" },
  { name: "Forms", to: "forms" },
  { name: "Resources", to: "resources" },
  { name: "Surveys", to: "surveys" },
  { name: "Users", to: "users" },
];

const AdminPanel: React.FC = () => {
  return (
    <>
      <Disclosure as="nav" className="bg-gray-800 mb-6 rounded-md">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button*/}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="hidden sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.to}
                          className={({ isActive }) =>
                            classNames(
                              isActive
                                ? "bg-gray-900 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white",
                              "rounded-md px-3 py-2 text-sm font-medium"
                            )
                          }
                        >
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {/* Right side buttons here */}
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={NavLink}
                    to={item.to}
                    className={(props: any) =>
                      classNames(
                        props.isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "block rounded-md px-3 py-2 text-base font-medium"
                      )
                    }
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <Outlet />
    </>
  );
};

export const adminPanelPermissionOptions = {
  permissions: [LEVEL.ADMIN],
  type: "all" as "all",
};

export default withRequirePermissions(AdminPanel, adminPanelPermissionOptions);
