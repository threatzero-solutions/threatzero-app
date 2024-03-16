import dayjs from "dayjs";
import { classNames, fromStatus, humanizeSlug } from "../../../utils/core";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getForms } from "../../../queries/forms";

const states = {
	draft: "text-gray-700 bg-gray-50 ring-gray-600/20",
	published: "text-secondary-800 bg-secondary-50 ring-secondary-600/20",
};

const FormsDashboard: React.FC = () => {
	const { data: forms } = useQuery({queryKey: ["form"], queryFn: () =>
		getForms({ resultType: "basic" }),
});

	return (
		<>
			<div className="border-b border-gray-200 pb-5 sm:flex sm:items-center">
				<h3 className="text-base font-semibold leading-6 text-gray-900">
					All Forms
				</h3>
			</div>
			<ul className="divide-y divide-gray-100">
				{forms?.results.map((form) => (
					<li
						key={form.id}
						className="flex items-center justify-between gap-x-6 py-5"
					>
						<div className="min-w-0">
							<div className="flex items-start gap-x-3">
								<p className="text-sm font-semibold leading-6 text-gray-900">
									{humanizeSlug(form.slug)}
								</p>
								<p
									className={classNames(
										states[form.state],
										"rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
									)}
								>
									{fromStatus(form.state)}
								</p>
							</div>
							<div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
								<p className="whitespace-nowrap">
									Last edit{" "}
									<time dateTime={form.updatedOn}>
										{dayjs(form.updatedOn).fromNow()}
									</time>
								</p>
								<svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
									<circle cx={1} cy={1} r={1} />
								</svg>
								<p className="truncate">
									{form.version
										? `Latest version ${form.version}`
										: "Unpublished"}
								</p>
							</div>
						</div>
						<div className="flex flex-none items-center gap-x-4">
							<Link
								to={form.slug}
								className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
							>
								Manage
								<span className="sr-only">, {humanizeSlug(form.slug)}</span>
							</Link>
						</div>
					</li>
				))}
			</ul>
		</>
	);
};

export default FormsDashboard;
