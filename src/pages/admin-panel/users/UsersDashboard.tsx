// const colorForJobStatus = (status: any) => {
// 	switch (status) {
// 		case "pending":
// 			return "yellow";
// 		case "completed":
// 			return "green";
// 		case "failed":
// 			return "red";
// 		default:
// 			return "gray";
// 	}
// };

import { useImmer } from "use-immer";
import DataTable from "../../../components/layouts/DataTable";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { getTrainingTokens } from "../../../queries/users";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useResolvedPath } from "react-router-dom";
import { OpaqueToken } from "../../../types/entities";

dayjs.extend(relativeTime);

const UsersDashboard: React.FC = () => {
  // 	const [recentImports] = useState<any[]>([
  // 		{
  // 			id: "abc04-ab03k4j-alsj30999944-909449",
  // 			type: "users_import",
  // 			status: "pending",
  // 			created_at: dayjs().toISOString(),
  // 		},
  // 	]);

  // 	const handleBulkUserImport = (e: React.ChangeEvent<HTMLInputElement>) => {
  // 		const file = e.target.files?.[0];
  // 		console.debug(file?.name);
  // 	};

  // 	const refreshJob = (id: string) => {
  // 		console.debug("refreshing job", id);
  // 	};

  const basePath = useResolvedPath("..");

  const [itemFilterOptions, setItemFilterOptions] =
    useImmer<ItemFilterQueryParams>({});

  const { data: trainingTokens, isLoading: trainingTokensLoading } = useQuery({
    queryKey: ["training-tokens", itemFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingTokens(queryKey[1]),
  });

  const copyTrainingUrl = (token: OpaqueToken) => {
    const url = `${window.location.origin}${basePath.pathname}/watch-training/${token.value.trainingItemId}?watchId=${token.key}`;
    navigator.clipboard.writeText(url);
  };

  const viewValue = (token: OpaqueToken) => {
    alert(JSON.stringify(token.value, null, 2));
  };

  return (
    <>
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center mb-8">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          User Management
        </h3>
      </div>

      <DataTable
        data={{
          headers: [
            {
              label: "Email",
              key: "email",
            },
            {
              label: "Created On",
              key: "createdOn",
            },
            {
              label: "Expires",
              key: "expiresOn",
            },
            {
              label: <span className="sr-only">Training Link</span>,
              key: "link",
              noSort: true,
            },
            {
              label: <span className="sr-only">View Token Value</span>,
              key: "view",
              align: "right",
              noSort: true,
            },
          ],
          rows: (trainingTokens?.results ?? []).map((t) => ({
            id: t.id,
            createdOn: dayjs(t.createdOn).format("MMM D, YYYY h:mm A"),
            email: t.value.email,
            expiresOn: (
              <span title={dayjs(t.value.expiresOn).format("MMM D, YYYY")}>
                {dayjs(t.value.expiresOn).fromNow()}
              </span>
            ),
            link: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => copyTrainingUrl(t)}
              >
                Copy Training Link
                <span className="sr-only">, {t.id}</span>
              </button>
            ),
            view: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => viewValue(t)}
              >
                View Value
                <span className="sr-only">, {t.id}</span>
              </button>
            ),
          })),
        }}
        isLoading={trainingTokensLoading}
        title="Training Tokens"
        subtitle="View and manage tokens used to provide special access to training materials."
        orderOptions={{
          order: itemFilterOptions.order,
          setOrder: (k, v) => {
            setItemFilterOptions((options) => {
              options.order = { [k]: v };
              options.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: trainingTokens?.offset,
          total: trainingTokens?.count,
          limit: trainingTokens?.limit,
          setOffset: (offset) =>
            setItemFilterOptions((q) => {
              q.offset = offset;
            }),
        }}
      />

      {/* <div className="overflow-hidden bg-white shadow sm:rounded-lg mb-8">
				<div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
					<h3 className="text-base font-semibold leading-6 text-gray-900">
						Import Users
					</h3>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
						Upload JSON to add users in bulk.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 px-4 py-5 sm:px-6">
					<div className="col-span-full">
						<div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
							<div className="text-center">
								<UserPlusIcon
									className="mx-auto h-12 w-12 text-gray-300"
									aria-hidden="true"
								/>
								<div className="mt-4 flex text-sm leading-6 text-gray-600">
									<label
										htmlFor="file-upload"
										className="relative cursor-pointer rounded-md bg-white font-semibold text-secondary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-secondary-600 focus-within:ring-offset-2 hover:text-secondary-500"
									>
										<span>Upload file</span>
										<input
											id="file-upload"
											name="file-upload"
											type="file"
											className="sr-only"
											onChange={handleBulkUserImport}
										/>
									</label>
									<p className="pl-1">or drag and drop</p>
								</div>
							</div>
						</div>
					</div>

					<ul className="divide-y divide-gray-100 col-span-full">
						{recentImports.map((recentImport) => (
							<li key={recentImport.id} className="py-4">
								<div className="flex items-center gap-x-3">
									<h3 className="truncate text-sm font-semibold leading-6 text-gray-900">
										{recentImport.id}
									</h3>
									<time
										dateTime={recentImport.created_at}
										className="flex-auto text-xs text-gray-500"
									>
										{dayjs(recentImport.created_at).fromNow()}
									</time>
									<PillBadge
										displayValue={recentImport.status}
										color={colorForJobStatus(recentImport.status)}
									/>
									<ArrowPathIcon
										className="flex-shrink-0 h-5 w-5 text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
										aria-hidden="true"
										title="Refresh"
										onClick={() => refreshJob(recentImport.id)}
									/>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="overflow-hidden bg-white shadow sm:rounded-lg mb-8">
				<div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
					<h3 className="text-base font-semibold leading-6 text-gray-900">
						Add Users to Organization
					</h3>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
						Upload JSON to add users to organizations with roles.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 px-4 py-5 sm:px-6">
					<div className="col-span-full">
						<div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
							<div className="text-center">
								<UserGroupIcon
									className="mx-auto h-12 w-12 text-gray-300"
									aria-hidden="true"
								/>
								<div className="mt-4 flex text-sm leading-6 text-gray-600">
									<label
										htmlFor="file-upload"
										className="relative cursor-pointer rounded-md bg-white font-semibold text-secondary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-secondary-600 focus-within:ring-offset-2 hover:text-secondary-500"
									>
										<span>Upload file</span>
										<input
											id="file-upload"
											name="file-upload"
											type="file"
											className="sr-only"
											onChange={handleBulkUserImport}
										/>
									</label>
									<p className="pl-1">or drag and drop</p>
								</div>
							</div>
						</div>
					</div>

					<ul className="divide-y divide-gray-100 col-span-full">
						{recentImports.map((recentImport) => (
							<li key={recentImport.id} className="py-4">
								<div className="flex items-center gap-x-3">
									<h3 className="truncate text-sm font-semibold leading-6 text-gray-900">
										{recentImport.id}
									</h3>
									<time
										dateTime={recentImport.created_at}
										className="flex-auto text-xs text-gray-500"
									>
										{dayjs(recentImport.created_at).fromNow()}
									</time>
									<PillBadge
										displayValue={recentImport.status}
										color={colorForJobStatus(recentImport.status)}
									/>
									<ArrowPathIcon
										className="flex-shrink-0 h-5 w-5 text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
										aria-hidden="true"
										title="Refresh"
										onClick={() => refreshJob(recentImport.id)}
									/>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div> */}
    </>
  );
};

export default UsersDashboard;
