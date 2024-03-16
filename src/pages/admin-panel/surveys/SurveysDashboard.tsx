import { useQuery } from "@tanstack/react-query";
import { getSurveys } from "../../../queries/surveys";
import { classNames, humanizeSlug } from "../../../utils/core";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import Notice from "../../../components/layouts/Notice";

const SurveysDashboard: React.FC = () => {
	const { data: surveys } = useQuery({ queryKey: ["user-surveys"], queryFn: () => getSurveys() });
	return (
		<>
			<Notice
				notice={"This feature is in the early stages of development."}
				className="mb-4"
			/>

			<div className="border-b border-gray-200 pb-5 sm:flex sm:items-center">
				<h3 className="text-base font-semibold leading-6 text-gray-900">
					User Surveys
				</h3>
			</div>
			<ul className="divide-y divide-gray-100">
				{surveys?.results.map((survey) => (
					<li
						key={survey.id}
						className="flex items-center justify-between gap-x-6 py-5"
					>
						<div className="min-w-0">
							<div className="flex items-start gap-x-3">
								<p className="text-sm font-semibold leading-6 text-gray-900">
									{humanizeSlug(survey.slug)}
								</p>
								{survey.audiences?.map((audience) => (
									<p
										key={audience.id}
										className={classNames(
											"hidden sm:block rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
										)}
									>
										{humanizeSlug(audience.slug)}
									</p>
								))}
							</div>
							<div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
								<p className="whitespace-nowrap">
									Last edit{" "}
									<time dateTime={survey.updatedOn}>
										{dayjs(survey.updatedOn).fromNow()}
									</time>
								</p>
								{survey.triggerOnStart && (
									<>
										<svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
											<circle cx={1} cy={1} r={1} />
										</svg>
										<p className="truncate">Triggered On Start</p>
									</>
								)}
								{survey.required && (
									<>
										<svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
											<circle cx={1} cy={1} r={1} />
										</svg>
										<p className="truncate">Required</p>
									</>
								)}
							</div>
						</div>
						<div className="flex flex-none items-center gap-x-4">
							<Link
								to={survey.slug}
								className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
							>
								Manage
								<span className="sr-only">, {humanizeSlug(survey.slug)}</span>
							</Link>
						</div>
					</li>
				))}
			</ul>
		</>
	);
};

export default SurveysDashboard;
