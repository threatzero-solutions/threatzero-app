import { NavLink, Outlet } from "react-router-dom";
import { classNames } from "../../utils/core";

interface ResourcePageProps {
	title: string;
}

const tabs = [
	{ name: "Videos", to: "./videos" },
	{ name: "Documents", to: "./documents" },
];

const ResourcePage: React.FC<ResourcePageProps> = ({ title }) => {
	return (
		<>
			<div className="border-b border-gray-200 pb-5 sm:pb-0 mb-10">
				<h3 className="text-2xl font-semibold leading-6 text-gray-900">
					{title}
				</h3>
				<div className="mt-3 sm:mt-4">
					<div className="block">
						<nav className="-mb-px flex space-x-8">
							{tabs.map((tab) => (
								<NavLink
									key={tab.name}
									to={tab.to}
									className={({ isActive }) =>
										classNames(
											isActive
												? "border-secondary-500 text-secondary-600"
												: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
											"whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium",
										)
									}
								>
									{tab.name}
								</NavLink>
							))}
						</nav>
					</div>
				</div>
			</div>
			<Outlet />
		</>
	);
};

export default ResourcePage;
