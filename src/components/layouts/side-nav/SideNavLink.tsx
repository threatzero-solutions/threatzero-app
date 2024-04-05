import { NavLink, useLocation } from "react-router-dom";
import { classNames } from "../../../utils/core";
import { NavigationItem } from "../../../types/core";
import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface SideNavLinkProps {
  item: NavigationItem;
}

const SideNavLink: React.FC<SideNavLinkProps> = ({ item }) => {
  const location = useLocation();

  return (
    <li key={item.name}>
      {item.children ? (
        <Disclosure
          as="div"
          defaultOpen={item.children.some((c) =>
            location.pathname.startsWith(c.href ?? "#")
          )}
        >
          {({ open }) => (
            <>
              <Disclosure.Button className="flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                {item.name}
                <ChevronRightIcon
                  className={classNames(
                    open ? "rotate-90 text-gray-500" : "text-gray-400",
                    "ml-auto h-5 w-5 shrink-0"
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              <Disclosure.Panel as="ul" className="mt-1 px-2 space-y-1">
                {(item.children ?? []).map((subItem) => (
                  <li key={subItem.name}>
                    <NavLink
                      to={subItem.href ?? "#"}
                      className={({ isActive }: { isActive: boolean }) =>
                        classNames(
                          isActive
                            ? "bg-gray-50 text-primary-400 hover:text-primary-500 transition-colors"
                            : "text-gray-700 hover:text-primary-400 hover:bg-gray-50 transition-colors",
                          "block rounded-md p-2 text-sm leading-6 text-gray-700"
                        )
                      }
                    >
                      {subItem.name}
                    </NavLink>
                  </li>
                ))}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ) : (
        <NavLink
          to={item.href ?? "#"}
          className={({ isActive }) =>
            classNames(
              isActive
                ? "bg-gray-50 text-primary-400 hover:text-primary-500 transition-colors"
                : "text-gray-700 hover:text-primary-400 hover:bg-gray-50 transition-colors",
              "block rounded-md  p-2 text-sm leading-6 font-semibold"
            )
          }
        >
          {item.name}
        </NavLink>
      )}
    </li>
  );
};

export default SideNavLink;
