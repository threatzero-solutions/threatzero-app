import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DataTable from "../../../components/layouts/DataTable";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useImmer } from "use-immer";
import { POCFile } from "../../../types/entities";
import { getPOCFiles } from "../../../queries/safety-management";

const POCFilesDashboard: React.FC = () => {
  const [editPOCFileSliderOpen, setEditPOCFileSliderOpen] = useState(false);
  const [_, setSelectedPOCFile] = useState<Partial<POCFile> | undefined>();

  const [pocFilesQuery, setPocFilesQuery] = useImmer<ItemFilterQueryParams>({});
  // const [debouncedPocFilesQuery] = useDebounceValue(pocFilesQuery, 300);

  const { data: pocFiles, isLoading: pocFilesLoading } = useQuery({
    queryKey: ["pocFiles", pocFilesQuery] as const,
    queryFn: ({ queryKey }) => getPOCFiles(queryKey[1]),
  });

  const handleEditPOCFile = (pocFile?: POCFile) => {
    setSelectedPOCFile(pocFile);
    setEditPOCFileSliderOpen(true);
  };

  return (
    <>
      <DataTable
        data={{
          headers: [
            {
              label: "Person of Concern",
              key: "name",
            },
            {
              label: "Unit",
              key: "unit.name",
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
              noSort: true,
            },
          ],
          rows: (pocFiles?.results ?? []).map((pocFile) => ({
            id: pocFile.id,
            name: `${pocFile.pocFirstName} ${pocFile.pocLastName}`,
            ["unit.name"]: pocFile.unit?.name ?? "—",
            edit: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => handleEditPOCFile(pocFile)}
              >
                View
                <span className="sr-only">, {pocFile.id}</span>
              </button>
            ),
          })),
        }}
        isLoading={pocFilesLoading}
        title="Person of Concern (PoC) Files"
        subtitle="View, add or edit files for persons of concern."
        itemFilterQuery={pocFilesQuery}
        setItemFilterQuery={setPocFilesQuery}
        paginationOptions={{
          ...pocFiles,
        }}
        searchOptions={{
          searchQuery: pocFilesQuery.search ?? "",
          setSearchQuery: (search) => {
            setPocFilesQuery((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
        notFoundDetail="No POC files found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleEditPOCFile()}
          >
            + Create New POC File
          </button>
        }
      />
      <SlideOver
        open={editPOCFileSliderOpen}
        setOpen={setEditPOCFileSliderOpen}
      >
        {/* <EditPOCFile
          setOpen={setEditPOCFileSliderOpen}
          organization={selectedPOCFile}
        /> */}
        <></>
      </SlideOver>
    </>
  );
};

export default POCFilesDashboard;
