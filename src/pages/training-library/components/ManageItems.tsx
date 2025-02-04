import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import AddNew from "../../../components/forms/builder/AddNew";
import FilterBar from "../../../components/layouts/FilterBar";
import Paginator from "../../../components/layouts/Paginator";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { LEVEL } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { getTrainingItems } from "../../../queries/training";
import { TrainingItem } from "../../../types/entities";
import EditTrainingItem from "./edit-training-item/EditTrainingItem";
import TrainingItemTile from "./TrainingItemTile";

interface ManageItemsProps {
  setOpen: (open: boolean) => void;
  isSelecting?: boolean;
  multiple?: boolean;
  excludeSelected?: boolean;
  onConfirmSelection?: (selection: Partial<TrainingItem>[]) => void;
  existingItemSelection?: Partial<TrainingItem>[];
}

const ManageItems: React.FC<ManageItemsProps> = ({
  setOpen: setOpenSlider,
  isSelecting,
  multiple,
  excludeSelected,
  onConfirmSelection,
  existingItemSelection,
}) => {
  const [isManagingItems, setIsManagingItems] = useState(false);
  const [editItemSliderOpen, setEditItemSliderOpen] = useState(false);
  const [itemEditing, setItemEditing] = useState<Partial<TrainingItem>>();
  const [selection, setSelection] = useState<Partial<TrainingItem>[]>(
    excludeSelected ? [] : existingItemSelection ?? []
  );

  const { hasPermissions } = useAuth();

  const canManageItems = useMemo(
    () => hasPermissions([LEVEL.ADMIN]),
    [hasPermissions]
  );

  const selectedIds = useMemo(() => selection.map((i) => i.id), [selection]);

  const setOpen = useCallback(
    (open: boolean) => {
      if (!open && isSelecting && isManagingItems) {
        setIsManagingItems(false);
        return;
      }
      setOpenSlider(open);
    },
    [setOpenSlider, isSelecting, isManagingItems]
  );

  const [itemFilterOptions, setItemFilterOptions] =
    useImmer<ItemFilterQueryParams>({});
  const [debouncedItemFilterOptions] = useDebounceValue(itemFilterOptions, 300);

  const { data: itemsData } = useQuery({
    queryKey: ["training-items", debouncedItemFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingItems(queryKey[1]),
  });

  const items = useMemo(
    () =>
      isSelecting && excludeSelected
        ? itemsData?.results.filter(
            (i) => !existingItemSelection?.find((_i) => _i.id === i.id)
          )
        : itemsData?.results,
    [itemsData, existingItemSelection, isSelecting, excludeSelected]
  );

  useEffect(() => {
    setIsManagingItems(!isSelecting);
  }, [isSelecting]);

  const handleSelectItem = (item?: Partial<TrainingItem>) => {
    if (!item) return;

    setSelection((s) => {
      if (s.find((i) => i.id === item.id)) {
        if (!multiple) {
          return [];
        }

        return s.filter((i) => i.id !== item.id);
      }

      if (!multiple) {
        return [item];
      }

      return [...s, item];
    });
  };

  const handleConfirmSelection = () => {
    onConfirmSelection?.(selection);
    setOpen(false);
  };

  const handleEditItem = (item?: Partial<TrainingItem>) => {
    setItemEditing(item);
    setEditItemSliderOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <SlideOverHeading
          title={isManagingItems ? "All items" : "Select Items to Add"}
          description=""
          setOpen={setOpen}
        />

        <div className="px-4 py-4 sm:px-6">
          <FilterBar
            searchOptions={{
              setSearchQuery: (query: string) => {
                setItemFilterOptions((o) => {
                  o.search = query;
                  o.offset = 0;
                });
              },
              searchQuery: itemFilterOptions.search ?? "",
              fullWidth: true,
            }}
          />
        </div>

        {/* ITEMS */}
        <div className="grow pt-2 pb-8 px-4 space-y-6 sm:px-6 overflow-y-auto">
          {items && (
            <>
              {items?.map((item) => (
                <TrainingItemTile
                  key={item.id}
                  item={item}
                  className="shadow-lg"
                  dense={true}
                  selected={selectedIds.includes(item.id)}
                  onAddItem={isManagingItems ? undefined : handleSelectItem}
                  onRemoveItem={isManagingItems ? undefined : handleSelectItem}
                  onEditItem={isManagingItems ? handleEditItem : undefined}
                  navigateDisabled={true}
                />
              ))}

              {items.length === 0 && (
                <AddNew
                  contentName="item"
                  pluralContentName="items"
                  onAdd={() => handleEditItem()}
                />
              )}
            </>
          )}
        </div>

        <div>
          <Paginator
            {...itemsData}
            setOffset={(offset) =>
              setItemFilterOptions((o) => {
                o.offset = offset;
              })
            }
          />
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            {!isManagingItems && canManageItems && (
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setIsManagingItems(true)}
              >
                Manage Items
              </button>
            )}
            <div className="grow" />
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            {isManagingItems ? (
              <button
                type="button"
                onClick={() => handleEditItem()}
                className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                + Create New Item
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmSelection()}
                className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50 disabled:pointer-events-none"
                disabled={selection.length === 0}
              >
                {multiple
                  ? `Add Selection (${selection.length})`
                  : "Select Item"}
              </button>
            )}
          </div>
        </div>
      </div>
      <SlideOver open={editItemSliderOpen} setOpen={setEditItemSliderOpen}>
        <EditTrainingItem
          setOpen={setEditItemSliderOpen}
          itemId={itemEditing?.id}
        />
      </SlideOver>
    </>
  );
};

export default ManageItems;
