import { useQuery } from "@tanstack/react-query";
import DataTable, {
  useDataTableFilterOptions,
} from "../../../../components/layouts/DataTable";
import { getTrainingItems } from "../../../../queries/training";
import dayjs from "dayjs";

const TrainingItemTable: React.FC = () => {
  const { tableFilterOptions, setTableFilterOptions } =
    useDataTableFilterOptions({
      order: { createdOn: "DESC" },
    });

  const { data: items } = useQuery({
    queryKey: ["training-items", tableFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingItems(queryKey[1]),
  });

  return (
    <>
      <DataTable
        data={{
          headers: [
            { label: "Name", key: "metadataTitle" },
            { label: "Created on", key: "createdOn" },
            { label: "Type", key: "type" },
          ],
          rows: (items?.results ?? []).map((item) => ({
            id: item.id,
            metadataTitle: (
              <div className="flex flex-col gap-2">
                {item.metadata.title && (
                  <h2
                    dangerouslySetInnerHTML={{ __html: item.metadata.title }}
                    className="text-md font-semibold text-gray-700"
                  />
                )}
                {item.metadata.description && (
                  <p
                    dangerouslySetInnerHTML={{
                      __html: item.metadata.description,
                    }}
                    className="text-xs font-medium text-gray-500 whitespace-break-spaces line-clamp-2"
                  />
                )}
              </div>
            ),
            createdOn: dayjs(item.createdOn).format("MMM D, YYYY"),
            type: item.type,
          })),
        }}
        title="Training Items"
        subtitle="View, add, or edit training items."
        notFoundDetail="No training items found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => {}}
          >
            + Create New Item
          </button>
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
          currentOffset: items?.offset ?? 0,
          pageSize: 10,
          total: items?.count ?? 0,
          limit: items?.limit ?? 1,

          setOffset: (offset) =>
            setTableFilterOptions((options) => ({ ...options, offset })),
        }}
      />
    </>
  );
};

export default TrainingItemTable;
