import { NavLink } from "react-router-dom";
import { classNames } from "../../../utils/core";
import { NavigationItem } from "../../../types/core";

interface SideNavLinkProps {
	item: NavigationItem;
}

const SideNavLink: React.FC<SideNavLinkProps> = ({ item }) => {
	return (
		<li key={item.name}>
			<NavLink
				to={item.href}
				className={({ isActive }) =>
					classNames(
						isActive
							? "bg-gray-50 text-primary-400 hover:text-primary-500 transition-colors"
							: "text-gray-700 hover:text-primary-400 hover:bg-gray-50 transition-colors",
						"group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
					)
				}
			>
				{item.name}
			</NavLink>
		</li>
	);
};

export default SideNavLink;
