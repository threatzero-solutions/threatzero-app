import {
  ArrowRightIcon,
  ArrowUturnRightIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import {
  ExpandedState,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ReactNode, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import Dropdown from "../../../components/layouts/Dropdown";
import FilterBar from "../../../components/layouts/FilterBar";
import Modal from "../../../components/layouts/modal/Modal";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import BaseTable from "../../../components/layouts/tables/BaseTable";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useOpenData } from "../../../hooks/use-open-data";
import { Unit } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import EditOrganizationBasic from "./EditOrganizationBasic";
import MoveUnitForm from "./MoveUnitForm";

const unitsColumnHelper = createColumnHelper<Unit>();

interface SubunitsTableProps {
  organizationId: string;
  units?: Unit[] | null;
  unitsLoading?: boolean;
  unitId?: string;
  unitIdType?: "id" | "slug";
  setUnitsPath: (unitsPath: string) => void;
  showOnEmpty?: boolean;
  render?: (children: ReactNode) => ReactNode;
  unitsLabelSingular?: string;
  unitsLabelPlural?: string;
  onAddSubunitSuccess?: () => void;
}

const SubunitsTable: React.FC<SubunitsTableProps> = ({
  organizationId,
  units,
  unitsLoading = false,
  unitId,
  unitIdType = "slug",
  setUnitsPath,
  showOnEmpty = true,
  render = (children) => children,
  unitsLabelSingular = "Unit",
  unitsLabelPlural = "Units",
  onAddSubunitSuccess,
}) => {
  const { hasPermissions } = useAuth();
  const [addBaseOrganizationOpen, setAddBaseOrganizationOpen] = useState(false);
  const moveUnit = useOpenData<Unit>();
  const { openData: openMoveUnit } = moveUnit;
  const editUnit = useOpenData<Unit>();
  const { openData: openEditUnit } = editUnit;

  const [unitsExpanded, setUnitsExpanded] = useImmer<ExpandedState>(
    false as ExpandedState,
  );
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

      const assignChildren = (unit: Unit): Unit => ({
        ...unit,
        subUnits: units
          .filter((u) => u.parentUnit?.slug === unit.slug)
          .map(assignChildren),
      });

      return roots.map(assignChildren);
    }
    return [];
  }, [units, unitId, unitIdType]);

  const unitColumns = useMemo(
    () => [
      unitsColumnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => {
          const depth = row.depth;
          const canExpand = row.getCanExpand();
          const isExpanded = row.getIsExpanded();

          return (
            <div
              className="flex items-center"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              {canExpand ? (
                <button
                  onClick={() => row.toggleExpanded()}
                  className="mr-2 rounded bg-primary-50 p-1 text-primary-500 transition-colors duration-200 hover:bg-primary-100 hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.original.name}`}
                  aria-expanded={isExpanded}
                >
                  <ChevronRightIcon
                    className={classNames(
                      "size-5 transition-transform duration-200",
                      isExpanded ? "rotate-90" : "",
                    )}
                  />
                </button>
              ) : (
                <span className="mr-2 w-5 p-1" />
              )}
              <span
                className={
                  canExpand ? "font-semibold text-gray-900" : "text-gray-700"
                }
              >
                {row.original.name}
              </span>
              {canExpand && (
                <span className="ml-2 inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                  {row.subRows.length}
                </span>
              )}
            </div>
          );
        },
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
            {hasPermissions([WRITE.UNITS]) && (
              <Dropdown
                iconOnly
                value="Actions"
                valueIcon={<EllipsisVerticalIcon className="size-4" />}
                actions={[
                  {
                    id: "edit",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <PencilIcon className="size-4 inline" /> Edit
                      </span>
                    ),
                    action: () => openEditUnit(row.original),
                  },
                  {
                    id: "move",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <ArrowUturnRightIcon className="size-4 inline" /> Move
                      </span>
                    ),
                    action: () => openMoveUnit(row.original),
                  },
                ]}
              />
            )}
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [setUnitsPath, openEditUnit, openMoveUnit, hasPermissions],
  );

  const unitsTable = useReactTable({
    data: nestedUnits,
    columns: unitColumns,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: "name", desc: false }],
    },
    state: {
      expanded: unitsExpanded,
      globalFilter: unitsSearch,
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
    paginateExpandedRows: false,
  });

  return nestedUnits.length > 0 || showOnEmpty ? (
    render(
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {hasPermissions([WRITE.UNITS]) ? (
              <button
                type="button"
                className={classNames(
                  "block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
                  "inline-flex items-center gap-x-1",
                )}
                onClick={() => setAddBaseOrganizationOpen(true)}
              >
                <PlusIcon className="size-4 inline" />
                New {unitsLabelSingular}
              </button>
            ) : (
              <div></div>
            )}
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
            onSaveSuccess={() => onAddSubunitSuccess?.()}
          />
        </SlideOver>
        <SlideOver open={editUnit.open} setOpen={editUnit.setOpen}>
          {editUnit.data && (
            <EditOrganizationBasic
              setOpen={editUnit.setOpen}
              create={false}
              organizationId={organizationId}
              unitId={editUnit.data.id}
              level="unit"
              onSaveSuccess={() => onAddSubunitSuccess?.()}
            />
          )}
        </SlideOver>
        <Modal open={moveUnit.open} setOpen={moveUnit.setOpen}>
          {moveUnit.data && (
            <MoveUnitForm
              organizationId={organizationId}
              unit={moveUnit.data}
              setOpen={moveUnit.setOpen}
            />
          )}
        </Modal>
      </>,
    )
  ) : (
    <></>
  );
};

export default SubunitsTable;
