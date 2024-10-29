import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUnits } from "../../../../queries/organizations";
import DataTable from "../../../../components/layouts/DataTable";
import { Unit } from "../../../../types/entities";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditUnit from "./EditUnit";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import { ItemFilterQueryParams } from "../../../../hooks/use-item-filter-query";
import { useOrganizationFilters } from "../../../../hooks/use-organization-filters";

export const ViewUnits: React.FC = () => {
  const [editUnitSliderOpen, setEditUnitSliderOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Partial<Unit> | undefined>();

  const [unitsQuery, setUnitsQuery] = useImmer<ItemFilterQueryParams>({
    order: { ["organization.name"]: "ASC", name: "ASC" },
  });
  const [debouncedUnitsQuery] = useDebounceValue(unitsQuery, 300);

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["units", debouncedUnitsQuery] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
  });

  const organizationFilters = useOrganizationFilters({
    query: unitsQuery,
    setQuery: setUnitsQuery,
    organizationKey: "organization.slug",
    unitsEnabled: false,
  });

  const handleEditUnit = (unit?: Unit) => {
    setSelectedUnit(unit);
    setEditUnitSliderOpen(true);
  };

  return (
    <>
      <DataTable
        data={{
          headers: [
            {
              label: "Name",
              key: "name",
            },
            {
              label: "Slug",
              key: "slug",
            },
            {
              label: "Organization",
              key: "organization.name",
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
            },
          ],
          rows: (units?.results ?? []).map((unit) => ({
            id: unit.id,
            name: unit.name,
            slug: unit.slug,
            ["organization.name"]: unit.organization?.name,
            edit: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => handleEditUnit(unit)}
              >
                Edit
                <span className="sr-only">, {unit.id}</span>
              </button>
            ),
          })),
        }}
        isLoading={unitsLoading}
        title="Units"
        subtitle="View, add or edit organizational units (i.e. schools, offices)."
        itemFilterQuery={unitsQuery}
        setItemFilterQuery={setUnitsQuery}
        paginationOptions={{
          ...units,
        }}
        searchOptions={{
          searchQuery: unitsQuery.search ?? "",
          setSearchQuery: (search) => {
            setUnitsQuery((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
        filterOptions={organizationFilters}
        notFoundDetail="No units found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleEditUnit()}
          >
            + Add New Unit
          </button>
        }
      />
      <SlideOver open={editUnitSliderOpen} setOpen={setEditUnitSliderOpen}>
        <EditUnit setOpen={setEditUnitSliderOpen} unit={selectedUnit} />
      </SlideOver>
    </>
  );
};
