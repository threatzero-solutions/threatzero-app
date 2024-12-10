import { ArrowRightIcon, MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../../utils/core";
import FilterBar from "../../../components/layouts/FilterBar";
import BaseTable from "../../../components/layouts/tables/BaseTable";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ExpandedState,
  createColumnHelper,
} from "@tanstack/react-table";
import { ReactNode, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { Unit } from "../../../types/entities";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import EditOrganizationBasic from "./EditOrganizationBasic";

const DEPTH_COLORS = [
  "bg-red-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-gray-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-lime-500",
  "bg-amber-500",
  "bg-fuchsia-500",
  "bg-violet-500",
  "bg-stone-500",
  "bg-rose-500",
  "bg-indigo-500",
];

const unitsColumnHelper = createColumnHelper<Unit>();

interface SubunitsTableProps {
  organizationId: string;
  units?: Unit[] | null;
  unitsLoading?: boolean;
  unitId?: string;
  unitIdType?: "id" | "slug";
  setUnitsPath: (unitsPath: string) => void;
  showOnEmtpy?: boolean;
  render?: (children: ReactNode) => ReactNode;
  unitsLabelSingular?: string;
  unitsLabelPlural?: string;
}

const SubunitsTable: React.FC<SubunitsTableProps> = ({
  organizationId,
  units,
  unitsLoading = false,
  unitId,
  unitIdType = "slug",
  setUnitsPath,
  showOnEmtpy = true,
  render = (children) => children,
  unitsLabelSingular = "Unit",
  unitsLabelPlural = "Units",
}) => {
  const [addBaseOrganizationOpen, setAddBaseOrganizationOpen] = useState(false);

  const [unitsExpanded, setUnitsExpanded] = useImmer<ExpandedState>(true);
  const [unitsSearch, setUnitsSearch] = useImmer<string>("");

  const thisUnit = useMemo(() => {
    if (units) {
      return units.find((u) => u[unitIdType] === unitId);
    }
    return null;
  }, [units, unitId, unitIdType]);

  const nestedUnits = useMemo(() => {
    if (units) {
      const allUnitSlugs = new Set<string>(units.map((u) => u.slug));
      const roots = units.filter((u) => {
        if (unitId) {
          return u.parentUnit?.[unitIdType] === unitId;
        }

        return !u.parentUnit || !allUnitSlugs.has(u.parentUnit.slug);
      });

      const assignChildren = (unit: Unit): Unit => {
        unit.subUnits = units
          .filter((u) => u.parentUnit?.slug === unit.slug)
          .map(assignChildren);
        return unit;
      };

      return roots.map(assignChildren);
    }
    return [];
  }, [units, unitId, unitIdType]);

  const parentSlugs = useMemo(() => {
    if (units) {
      return units
        .map((u) => u.parentUnit)
        .filter(Boolean)
        .reduce((acc, parent) => {
          if (acc.has(parent!.slug)) return acc;
          acc.set(parent!.slug, parent!);
          return acc;
        }, new Map<string, Unit>());
    }
    return new Map<string, Unit>();
  }, [units]);

  const parentUnitsColorMap = useMemo(() => {
    return [...parentSlugs.keys()].sort().reduce((map, slug, index) => {
      if (map.has(slug)) return map;
      map.set(slug, DEPTH_COLORS[index % DEPTH_COLORS.length]);
      return map;
    }, new Map<string, string>());
  }, [parentSlugs]);

  const unitColumns = useMemo(
    () => [
      unitsColumnHelper.display({
        id: "depth-indicator",
        header: "Hierarchy",
        cell: ({ row }) => {
          let path = row.original.path ?? "";
          if (thisUnit) {
            path = path.replace(thisUnit.path ?? "", "");
          }
          const paths = (path.split("/") ?? []).filter(Boolean);
          const depth = row.depth;
          const canExpand = row.getCanExpand();
          return (
            <div className="flex items-stretch h-10 -my-5 overflow-hidden w-min gap-1">
              {paths.map((slug, index) => (
                <button
                  key={index}
                  className={classNames(
                    "w-4 rounded-sm",
                    depth - index < 2
                      ? index === depth && !canExpand
                        ? "bg-gray-300"
                        : parentUnitsColorMap.get(slug)
                      : "transparent"
                  )}
                  disabled={index < depth || !canExpand}
                  onClick={() => {
                    row.toggleExpanded();
                  }}
                >
                  {index === depth && canExpand && (
                    <span className="text-white">
                      {row.getIsExpanded() ? (
                        <MinusIcon className="size-4" />
                      ) : (
                        <PlusIcon className="size-4" />
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        },
      }),
      unitsColumnHelper.accessor("name", {
        header: "Name",
      }),
      unitsColumnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ButtonGroup className="w-full justify-end">
            <IconButton
              onClick={() => setUnitsPath(row.original.path ?? "")}
              icon={ArrowRightIcon}
              className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
              trailing
              text="View"
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [parentUnitsColorMap, setUnitsPath, thisUnit]
  );

  const unitsTable = useReactTable({
    data: nestedUnits,
    columns: unitColumns,
    initialState: {
      pagination: { pageSize: 10 },
    },
    state: {
      expanded: unitsExpanded,
      globalFilter: unitsSearch,
      columnVisibility: {
        ["depth-indicator"]: parentSlugs.size > 0,
      },
    },
    onExpandedChange: setUnitsExpanded,
    onGlobalFilterChange: setUnitsSearch,
    getSubRows: (row) => row.subUnits,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFromLeafRows: true,
  });

  return nestedUnits.length > 0 || showOnEmtpy ? (
    render(
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              type="button"
              className={classNames(
                "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
                "inline-flex items-center gap-x-1"
              )}
              onClick={() => setAddBaseOrganizationOpen(true)}
            >
              <PlusIcon className="size-4 inline" />
              New {unitsLabelSingular}
            </button>
            <FilterBar
              searchOptions={{
                placeholder: "Search by name or email...",
                searchQuery: unitsSearch,
                setSearchQuery: setUnitsSearch,
              }}
            />
          </div>
          <BaseTable
            table={unitsTable}
            isLoading={unitsLoading}
            showFooter={false}
            noRowsMessage={`No ${unitsLabelPlural.toLowerCase()} found.`}
          />
        </div>
        <SlideOver
          open={addBaseOrganizationOpen}
          setOpen={setAddBaseOrganizationOpen}
        >
          <EditOrganizationBasic
            setOpen={setAddBaseOrganizationOpen}
            create
            organizationId={organizationId}
            parentUnitId={thisUnit?.id}
            level="unit"
          />
        </SlideOver>
      </>
    )
  ) : (
    <></>
  );
};

export default SubunitsTable;
