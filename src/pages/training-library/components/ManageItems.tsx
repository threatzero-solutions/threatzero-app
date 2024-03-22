import { useQuery } from "@tanstack/react-query";
import { getTrainingItems } from "../../../queries/training";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TrainingContext } from "../../../contexts/training/training-context";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import TrainingItemTile from "./TrainingItemTile";
import AddNew from "../../../components/forms/builder/AddNew";
import { TrainingItem, TrainingSectionItem } from "../../../types/entities";
import SlideOver from "../../../components/layouts/SlideOver";
import EditTrainingItem from "./edit-training-item/EditTrainingItem";
import FilterBar from "../../../components/layouts/FilterBar";
import { useItemFilterQuery } from "../../../hooks/use-item-filter-query";
import Paginator from "../../../components/layouts/Paginator";

interface ManageItemsProps {
  setOpen: (open: boolean) => void;
  isEditingSection?: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

const ManageItems: React.FC<ManageItemsProps> = ({
  setOpen: setOpenSlider,
  isEditingSection,
}) => {
  const [isManagingItems, setIsManagingItems] = useState(false);
  const [editItemSliderOpen, setEditItemSliderOpen] = useState(false);
  const [itemEditing, setItemEditing] = useState<Partial<TrainingItem>>();
  const [selection, setSelection] = useState<Partial<TrainingItem>[]>([]);

  const { sectionEditing, setSectionEditing } = useContext(TrainingContext);

  const selectedIds = useMemo(() => selection.map((i) => i.id), [selection]);

  const setOpen = useCallback(
    (open: boolean) => {
      if (!open && isEditingSection && isManagingItems) {
        setIsManagingItems(false);
        return;
      }
      setOpenSlider(open);
    },
    [setOpenSlider, isEditingSection, isManagingItems]
  );

  const {
    itemFilterOptions,
    setItemFilterOptions,
    debouncedItemFilterOptions,
  } = useItemFilterQuery(
    {
      order: { createdOn: "DESC" },
    },
    { prefix: "items_", pageSize: DEFAULT_PAGE_SIZE }
  );

  const { data: itemsData } = useQuery({
    queryKey: ["training-items", debouncedItemFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingItems(queryKey[1]),
  });

  const items = useMemo(
    () =>
      isManagingItems
        ? itemsData?.results
        : itemsData?.results.filter(
            (i) => !sectionEditing?.items?.find((_i) => _i.item.id === i.id)
          ),
    [itemsData, sectionEditing, isManagingItems]
  );

  useEffect(() => {
    setIsManagingItems(!isEditingSection);
  }, [isEditingSection]);

  const handleSelectItem = (item?: Partial<TrainingItem>) => {
    if (!item) return;

    setSelection((s) => {
      if (s.find((i) => i.id === item.id)) {
        return s.filter((i) => i.id !== item.id);
      }
      return [...s, item];
    });
  };

  const handleConfirmSelection = () => {
    setSectionEditing((s) => {
      const items = [
        ...(s?.items ?? []),
        ...selection.map(
          (i, idx) =>
            ({
              item: i,
              order: idx + (s?.items?.length ?? 0),
            } as TrainingSectionItem)
        ),
      ];

      return {
        ...(s ?? {}),
        items,
      };
    });
    setOpen(false);
  };

  const handleEditItem = (item?: Partial<TrainingItem>) => {
    setItemEditing(item);
    setEditItemSliderOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* HEADER */}
        <div className="bg-gray-50 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                {isManagingItems ? "All items" : "Select Items to Add"}
              </Dialog.Title>
              {/* <p className="text-sm text-gray-500">Select a course to view</p> */}
            </div>
            <div className="flex h-7 items-center">
              <button
                type="button"
                className="relative text-gray-400 hover:text-gray-500"
                onClick={() => setOpen(false)}
              >
                <span className="absolute -inset-2.5" />
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 sm:px-6">
          <FilterBar
            searchOptions={{
              setSearchQuery: (query: string) => {
                setItemFilterOptions((o) => {
                  o.search = query;
                });
              },
              searchQuery: itemFilterOptions.search ?? "",
              fullWidth: true,
            }}
          />
        </div>

        {/* ITEMS */}
        <div className="grow py-8 px-4 space-y-6 sm:px-6 overflow-y-auto">
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
            currentOffset={itemsData?.offset ?? 0}
            pageSize={DEFAULT_PAGE_SIZE}
            total={itemsData?.count ?? 0}
            limit={itemsData?.limit ?? DEFAULT_PAGE_SIZE}
            setOffset={(offset) =>
              setItemFilterOptions((o) => {
                o.offset = offset;
              })
            }
            pageParamName="items_page"
          />
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            {!isManagingItems && (
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setIsManagingItems(true)}
              >
                Manage Items
              </button>
            )}
            <div className="grow" />
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            {isManagingItems ? (
              <button
                type="button"
                onClick={() => handleEditItem()}
                className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                + Create New Item
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmSelection()}
                className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                Add Selection ({selection.length})
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
