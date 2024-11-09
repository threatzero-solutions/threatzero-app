import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DataTable from "../../../components/layouts/DataTable";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import EditResource from "./EditResource";
import {
  GetResourceItemOptions,
  getResourceItems,
} from "../../../queries/media";
import { ResourceItem, ResourceType } from "../../../types/entities";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";

export const ViewResources: React.FC = () => {
  const [editResourceSliderOpen, setEditResourceSliderOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<
    Partial<ResourceItem> | undefined
  >();

  const [itemFilterOptions, setItemFilterOptions] =
    useImmer<GetResourceItemOptions>({});
  const [debouncedItemFilterOptions] = useDebounceValue(itemFilterOptions, 300);

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["resource-items", debouncedItemFilterOptions] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

  const handleEditResource = (resource?: ResourceItem) => {
    setSelectedResource(resource);
    setEditResourceSliderOpen(true);
  };

  return (
    <>
      <DataTable
        data={{
          headers: [
            {
              label: "Title",
              key: "title",
            },
            {
              label: "Type",
              key: "type",
            },
            {
              label: "Category",
              key: "category",
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
              noSort: true,
            },
          ],
          rows: (resources?.results ?? []).map((resource) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type,
            category: resource.category,
            edit: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => handleEditResource(resource)}
              >
                Edit
                <span className="sr-only">, {resource.id}</span>
              </button>
            ),
          })),
        }}
        isLoading={resourcesLoading}
        title="Resources"
        subtitle="View, add or edit resource items."
        notFoundDetail="No resources found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleEditResource()}
          >
            + Add New Resource
          </button>
        }
        itemFilterQuery={itemFilterOptions}
        setItemFilterQuery={setItemFilterOptions}
        paginationOptions={{
          ...resources,
        }}
        searchOptions={{
          searchQuery: itemFilterOptions.search ?? "",
          setSearchQuery: (q) => {
            setItemFilterOptions((options) => {
              options.search = q;
              options.offset = 0;
            });
          },
        }}
        filterOptions={{
          filters: [
            {
              key: "type",
              label: "Resource Type",
              options: Object.values(ResourceType).map((type) => ({
                label: type,
                value: type,
              })),
            },
            {
              key: "category",
              label: "Category",
              options: [
                { label: "Prevention", value: "prevention" },
                { label: "Preparation", value: "preparation" },
                { label: "Response", value: "response" },
              ],
            },
          ],
          setQuery: setItemFilterOptions,
        }}
      />
      <SlideOver
        open={editResourceSliderOpen}
        setOpen={setEditResourceSliderOpen}
      >
        <EditResource
          setOpen={setEditResourceSliderOpen}
          resource={selectedResource}
        />
      </SlideOver>
    </>
  );
};
