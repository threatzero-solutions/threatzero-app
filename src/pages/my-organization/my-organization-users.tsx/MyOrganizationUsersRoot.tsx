import { NavLink, Outlet } from "react-router-dom";
import { classNames } from "../../../utils/core";

const navigation = [
  { name: "All Users", to: "all" },
  { name: "Access Management", to: "access" },
  { name: "Training Membership", to: "training" },
];

const MyOrganizationUsersRoot: React.FC = () => {
  return (
    <>
      <div className="mt-3 sm:mt-4">
        <div className="block">
          <nav className="-mb-px flex space-x-8">
            {navigation.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.to}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? "border-secondary-500 text-secondary-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium"
                  )
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default MyOrganizationUsersRoot;
