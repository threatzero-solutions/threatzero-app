import { useState } from "react";
import { READ } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { classNames, fromDaysKey, fromStatus } from "../../utils/core";
import { useQuery } from "@tanstack/react-query";
import {
	ThreatAssessmentFilterOptions,
	getThreatAssessmentStats,
	getThreatAssessments,
} from "../../queries/threat-assessments";
import { AssessmentStatus } from "../../types/entities";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import StatusPill from "./components/StatusPill";
import DataTable, {
	useDataTableFilterOptions,
} from "../../components/layouts/DataTable";
import { getUnits } from "../../queries/organizations";

dayjs.extend(relativeTime);

const DEFAULT_PAGE_SIZE = 10;

const ThreatAssessmentDashboard: React.FC = () => {
	const location = useLocation();
		
	const { tableFilterOptions, setTableFilterOptions } =
		useDataTableFilterOptions({
			order: { createdOn: "DESC" },
		});
	const { data: assessments, isLoading: assessmentsLoading } = useQuery({
		queryKey: ["threat-assessments", tableFilterOptions],
		queryFn: ({ queryKey }) =>
			getThreatAssessments(queryKey[1] as ThreatAssessmentFilterOptions),
	});
	const [statsFilterOptions] =
		useState<ThreatAssessmentFilterOptions>({});
	const { data: assessmentStats } = useQuery({
		queryKey: ["threat-assessment-stats", statsFilterOptions],
		queryFn: ({ queryKey }) =>
			getThreatAssessmentStats(queryKey[1] as ThreatAssessmentFilterOptions),
	});

	const { data: units } = useQuery({
		queryKey: ["units"],
		queryFn: () => getUnits({ limit: 100 }),
	});

	return (
		<div className={"space-y-12"}>
			{/* STATS */}
			{assessmentStats ? (
				<div>
					<h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
						New Assessments
					</h3>
					<dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 shadow-md">
						{Object.entries(assessmentStats.subtotals.newSince).map(
							([key, subtotal]) => (
								<div
									key={key}
									className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
								>
									<dt className="text-sm font-medium leading-6 text-gray-500">
										{fromDaysKey(key)}
									</dt>
									<dd
										className={classNames(
											"text-gray-700",
											"text-xs font-medium",
										)}
									>
										{((subtotal / assessmentStats.total) * 100).toFixed(2)}%
									</dd>
									<dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
										{subtotal}
									</dd>
								</div>
							),
						)}
					</dl>
				</div>
			) : (
				<div className="w-full">
					<div className="animate-pulse flex-1">
						<div className="h-36 bg-slate-200 rounded" />
					</div>
				</div>
			)}
			{assessmentStats ? (
				<div>
					<h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
						Status Totals
					</h3>
					<dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 shadow-md">
						{Object.entries(assessmentStats.subtotals.statuses).map(
							([key, subtotal]) => (
								<div
									key={key}
									className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
								>
									<dt className="text-sm font-medium leading-6 text-gray-500">
										<StatusPill status={key as AssessmentStatus} />
									</dt>
									<dd
										className={classNames(
											"text-gray-700",
											"text-xs font-medium",
										)}
									>
										{((subtotal / assessmentStats.total) * 100).toFixed(2)}%
									</dd>
									<dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
										{subtotal}
									</dd>
								</div>
							),
						)}
					</dl>
				</div>
			) : (
				<div className="w-full">
					<div className="animate-pulse flex-1">
						<div className="h-36 bg-slate-200 rounded" />
					</div>
				</div>
			)}

			{/* VIEW ASSESSMENTS */}
			<DataTable
				data={{
					headers: [
						{
							label: "Status",
							key: "status",
						},
						{
							label: "Created On",
							key: "createdOn",
						},
						{
							label: "Last Updated",
							key: "updatedOn",
						},
						{
							label: "Unit",
							key: "unit",
						},
						{
							label: <span className="sr-only">View</span>,
							key: "view",
							align: "right",
						},
					],
					rows:
						assessments?.results.map((assessment) => ({
							id: assessment.id,
							status: <StatusPill status={assessment.status} />,
							createdOn: dayjs(assessment.createdOn).format("MMM D, YYYY"),
							updatedOn: dayjs(assessment.updatedOn).fromNow(),
							unit: assessment.unit?.name ?? assessment.unit?.slug,
							view: (
								<Link
									to={`./${assessment.id}`}
									state={{ from: location }}
									className="text-secondary-600 hover:text-secondary-900 font-medium"
								>
									View
									<span className="sr-only">, {assessment.id}</span>
								</Link>
							),
						})) ?? [],
				}}
				isLoading={assessmentsLoading}
				notFoundDetail="No assessments found."
				title="View Assessments"
				subtitle="Sort and filter through active and closed threat assessments."
				action={
					<Link to={"./new"}>
						<button
							type="button"
							className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
						>
							+ Start New Assessment
						</button>
					</Link>
				}
				orderOptions={{
					order: tableFilterOptions.order,
					setOrder: (k, v) => {
						setTableFilterOptions((options) => {
							options.order = { [k]: v };
							options.offset = 0;
						});
					},
				}}
				paginationOptions={{
					currentOffset: assessments?.offset ?? 0,
					pageSize: DEFAULT_PAGE_SIZE,
					total: assessments?.count ?? 0,
					limit: assessments?.limit ?? 1,

					setOffset: (offset) =>
						setTableFilterOptions((options) => ({ ...options, offset })),
				}}
				filterOptions={{
					filters: [
						{
							key: "status",
							label: "Status",
							value: tableFilterOptions.status
								? `${tableFilterOptions.status}`
								: undefined,
							options: Object.values(AssessmentStatus).map((status) => ({
								value: status,
								label: fromStatus(status),
							})),
						},
						{
							key: "unitSlug",
							label: "Unit",
							value: tableFilterOptions.unitSlug
								? `${tableFilterOptions.unitSlug}`
								: undefined,
							// TODO: Dynamically get all units.
							options: units?.results.map((unit) => ({
								value: unit.slug,
								label: unit.name,
							})) ?? [{ value: undefined, label: "All schools" }],
						},
					],
					setFilter: (key, value) =>
						setTableFilterOptions((options) => ({
							...options,
							[key]: options[key] === value ? undefined : value,
							offset: 0,
						})),
				}}
			/>
		</div>
	);
};

export const threatAssessmentPermissionsOptions = {
	permissions: [READ.THREAT_ASSESSMENTS],
};

export default withRequirePermissions(
	ThreatAssessmentDashboard,
	threatAssessmentPermissionsOptions,
);
