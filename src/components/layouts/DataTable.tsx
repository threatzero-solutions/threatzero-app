import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
	camelToSnake,
	classNames,
	parseOrder,
	snakeToCamel,
	stringifyOrder,
} from "../../utils/core";
import Paginator, { PaginatorProps } from "./Paginator";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import Input from "../forms/inputs/Input";
import Dropdown from "./Dropdown";
import { useDebounceCallback } from "usehooks-ts";
import { OrderOptions, Ordering } from "../../types/core";
import { useSearchParams } from "react-router-dom";
import { useImmer } from "use-immer";

export interface DataTableSearchOptions {
	placeholder?: string;
	setSearchQuery?: (query: string) => void;
	debounceTime?: number;
}

export interface DataTableFilterOption {
	label: string;
	value?: string;
}

export interface DataTableFilter {
	key: string;
	label: string;
	options: DataTableFilterOption[];
	value?: string;
}

export interface DataTableFilterOptions {
	filters?: DataTableFilter[];
	setFilter?: (key: string, value?: string) => void;
}

export interface DataTableOrderOptions {
	order?: Ordering;
	setOrder?: (key: string, value: OrderOptions) => void;
}

export interface DataTableQueryParams {
	offset?: string | number;
	order?: Ordering;
	limit?: string | number;
	search?: string;
	[key: string]: unknown;
}

export const useDataTableFilterOptions = (
	initialValue: DataTableQueryParams = {},
	options: {
		prefix?: string;
		pageSize?: number;
	} = {},
) => {
	const DEFAULT_PREFIX = "tbl_";
	const DEFAULT_PAGE_SIZE = 10;
	const initialized = useRef(false);

	const prefix = options.prefix ?? DEFAULT_PREFIX;

	const parameterizeOptions = <T,>(
		options: DataTableQueryParams,
		valueMap: (v: string | undefined) => T,
	) => {
		const { offset, order, search, limit, ...customParams } = options;
		const p: Record<string, T> = {
			offset: valueMap(offset ? `${offset}` : undefined),
			order: valueMap(order && stringifyOrder(order)),
			search: valueMap(search),
			...Object.entries(customParams ?? {}).reduce((acc, [k, v]) => {
				const value = v !== undefined ? `${v}` : v;
				acc[k] = valueMap(value);
				return acc;
			}, {} as Record<string, T>),
		};
		return p;
	};

	const removeEmpties = (obj: object) => {
		return Object.fromEntries(
			Object.entries(obj).filter(([, v]) => Number.isInteger(v) || !!v),
		);
	};

	const [searchParams, setSearchParams] = useSearchParams();

	const tableFilterOptions = useMemo<DataTableQueryParams>(() => {
		const customParams = Array.from(searchParams.entries()).reduce(
			(acc, [key, value]) => {
				if (key.startsWith(prefix) && value) {
					const k = key.slice(prefix.length);
					if (!["offset", "order", "search", "limit"].includes(k)) {
						acc[snakeToCamel(k)] = value;
					}
				}
				return acc;
			},
			{} as Record<string, string>,
		);

		const orderParam = searchParams.get(`${prefix}order`);

		return removeEmpties({
			limit: options.pageSize ?? DEFAULT_PAGE_SIZE,
			offset: searchParams.get(`${prefix}offset`) ?? 0,
			order: orderParam ? parseOrder(orderParam) : undefined,
			search: searchParams.get(`${prefix}search`) ?? "",
			...customParams,
		});
	}, [searchParams, options.pageSize, prefix]);

	const [params, setParams] = useImmer<DataTableQueryParams>({});

	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true;
			setParams({
				...initialValue,
				...tableFilterOptions,
			});
			return;
		}
	}, [initialValue, tableFilterOptions, setParams]);

	useEffect(() => {
		if (!Object.keys(params).length) {
			return;
		}

		const prefix = options.prefix ?? DEFAULT_PREFIX;
		const p = parameterizeOptions(params, (v) => v);
		setSearchParams(
			(draft) => {
				Object.entries(p).forEach(([k, v]) => {
					const key = `${prefix}${camelToSnake(k)}`;
					if (v) {
						draft.set(key, v);
					} else {
						draft.delete(key);
					}
				});
				return draft;
			},
			{ replace: true },
		);
	}, [params, options.prefix, setSearchParams]);

	return {
		tableFilterOptions,
		setTableFilterOptions: setParams,
		searchParams,
		setSearchParams,
	};
};

interface DataTableProps {
	className?: string;
	title?: string;
	subtitle?: string;
	action?: ReactNode;
	data?: {
		headers: {
			label: ReactNode;
			key: string;
			align?: "left" | "center" | "right";
		}[];
		rows: {
			id: string;
			[key: string]: ReactNode;
		}[];
	};
	isLoading?: boolean;
	notFoundDetail?: ReactNode;
	paginationOptions?: PaginatorProps;
	searchOptions?: DataTableSearchOptions;
	filterOptions?: DataTableFilterOptions;
	orderOptions?: DataTableOrderOptions;
}

const DataTable: React.FC<DataTableProps> = ({
	className,
	title,
	subtitle,
	action,
	data,
	isLoading,
	notFoundDetail,
	paginationOptions,
	orderOptions,
	searchOptions,
	filterOptions,
}) => {
	const debouncedSearch = useDebounceCallback((query: string) => {
		if (searchOptions?.setSearchQuery) {
			searchOptions.setSearchQuery(query);
		}
	}, searchOptions?.debounceTime ?? 300);

	const rowsRef = useRef<HTMLTableSectionElement>(null);

	const [rowsHeight, setRowsHeight] = useState(96);
	useEffect(() => {
		if (rowsRef.current && !isLoading) {
			setRowsHeight(rowsRef.current.clientHeight);
		}
	}, [isLoading, rowsRef.current]);

	return (
		<div className={className}>
			<div>
				<div className="sm:flex sm:items-center">
					<div className="sm:flex-auto">
						{title && (
							<h1 className="text-base font-semibold leading-6 text-gray-900">
								{title}
							</h1>
						)}
						{subtitle && (
							<p className="mt-2 text-sm text-gray-700">{subtitle}</p>
						)}
					</div>
					<div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">{action}</div>
				</div>
				{(searchOptions || filterOptions) && (
					<div className="flex justify-end mt-4 -mb-4 gap-4">
						{filterOptions && (
							<Dropdown
								value="Filter"
								actionGroups={filterOptions.filters?.map((f) => ({
									id: `id-${f.key}`,
									value: f.label,
									actions: [
										...f.options.map((o) => ({
											id: o.value ?? "none",
											value: (
												<div className="pl-1">
													<input
														type="checkbox"
														readOnly={true}
														className="pointer-events-none h-4 w-4 mr-2 rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
														checked={o.value === f.value}
													/>
													{o.label}
												</div>
											),
											action: () => filterOptions?.setFilter?.(f.key, o.value),
										})),
										{
											id: "clear",
											value: (
												<span
													className={classNames(
														"pl-1 text-xs font-semibol",
														f.value === undefined
															? "text-gray-400"
															: "text-secondary-600",
													)}
												>
													clear
												</span>
											),
											action: () =>
												filterOptions?.setFilter?.(f.key, undefined),
											disabled: f.value === undefined,
											hidden: f.options.some((o) => o.value === undefined),
										},
									],
								}))}
								openTo="left"
								showDividers={true}
							/>
						)}
						{searchOptions && (
							<Input
								type="search"
								className="w-full max-w-80"
								placeholder={searchOptions?.placeholder ?? "Search..."}
								onChange={(e) => debouncedSearch(e.target.value)}
							/>
						)}
					</div>
				)}
				<div className="mt-8 flow-root">
					<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
							<table className="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										{data?.headers.map(({ label, key, align }, idx) => (
											<th
												key={key}
												scope="col"
												className={classNames(
													"py-3.5 text-left text-sm font-semibold text-gray-900",
													idx === 0
														? "pl-4 pr-3 sm:pl-0"
														: idx === data.headers.length - 1
														? "pl-3 pr-4 sm:pr-0"
														: "px-3",
													`text-${align ?? "left"}`,
												)}
											>
												<div
													className={classNames(
														"group inline-flex",
														orderOptions?.setOrder ? "cursor-pointer" : "",
													)}
													onClick={() =>
														orderOptions?.setOrder?.(
															key,
															orderOptions?.order?.[key] === "ASC"
																? "DESC"
																: "ASC",
														)
													}
													onKeyUp={() => {}}
												>
													{label}
													{!!orderOptions?.setOrder && (
														<span
															className={classNames(
																"ml-2 flex-none rounded transition-colors",
																orderOptions?.order?.[key]
																	? "bg-gray-100 text-gray-900 group-hover:bg-gray-200"
																	: "invisible text-gray-400 group-hover:visible group-focus:visible",
															)}
														>
															{orderOptions?.order?.[key] !== "ASC" ? (
																<ChevronDownIcon
																	className="h-5 w-5"
																	aria-hidden="true"
																/>
															) : (
																<ChevronUpIcon
																	className="h-5 w-5"
																	aria-hidden="true"
																/>
															)}
														</span>
													)}
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200" ref={rowsRef}>
									{!isLoading &&
										data?.rows.map((row) => (
											<tr key={row.id}>
												{data.headers.map(({ key, align }, idx_col) => (
													<td
														key={`${row.id}_${key}`}
														className={classNames(
															"whitespace-nowrap py-4 text-sm text-gray-500",
															idx_col === 0
																? "pl-4 pr-3 sm:pl-0"
																: idx_col === data.headers.length - 1
																? "pl-3 pr-4 sm:pr-0"
																: "px-3",
															`text-${align ?? "left"}`,
														)}
													>
														{row[key]}
													</td>
												))}
											</tr>
										))}
								</tbody>
							</table>
							{isLoading && (
								<div className="w-full">
									<div className="animate-pulse flex-1">
										<div
											className="bg-slate-200"
											style={{
												height: rowsHeight ?? "96px",
											}}
										/>
									</div>
								</div>
							)}
							{!isLoading && data && data.rows.length === 0 && (
								<p className="text-sm text-gray-500 text-center py-4 border-t border-gray-300">
									{notFoundDetail ?? "No details."}
								</p>
							)}
						</div>
					</div>
				</div>
				{paginationOptions && <Paginator {...paginationOptions} />}
			</div>
		</div>
	);
};

export default DataTable;
