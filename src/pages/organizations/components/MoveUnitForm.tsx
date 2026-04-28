import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { saveUnit } from "../../../queries/organizations";
import { Unit } from "../../../types/entities";

interface MoveUnitFormProps {
  organizationId: string;
  unit: Unit;
  setOpen: (open: boolean) => void;
}

const MoveUnitForm: React.FC<MoveUnitFormProps> = ({
  organizationId,
  unit,
  setOpen,
}) => {
  const [selectedParentUnit, setSelectedParentUnit] = useState<Unit | null>(
    null,
  );
  const [moveToTopLevel, setMoveToTopLevel] = useState(false);

  const {
    setOpen: setConfirmationOpen,
    setClose: setConfirmationClose,
    setConfirmationOptions,
  } = useContext(ConfirmationContext);
  const { invalidateAllUnitsQuery } = useContext(OrganizationsContext);

  const currentParent = useMemo(() => unit.parentUnit ?? null, [unit]);

  useEffect(() => {
    if (currentParent) {
      setSelectedParentUnit(currentParent);
    }
  }, [currentParent]);

  const excludeFilter = useCallback(
    (candidate: Unit) => {
      const unitPath = unit.path ?? "";
      if (!unitPath) return candidate.id !== unit.id;
      return (
        candidate.id !== unit.id &&
        candidate.path !== unitPath &&
        !candidate.path?.startsWith(unitPath + "/")
      );
    },
    [unit],
  );

  const { mutate: move, isPending } = useMutation({
    mutationFn: () =>
      saveUnit({
        id: unit.id,
        parentUnit: moveToTopLevel
          ? null
          : selectedParentUnit
            ? { id: selectedParentUnit.id }
            : null,
      }),
    onSuccess: () => {
      invalidateAllUnitsQuery();
      setConfirmationClose();
      setOpen(false);
    },
    onError: () => {
      setConfirmationClose();
    },
  });

  useEffect(() => {
    setConfirmationOptions((options) => {
      options.isPending = isPending;
    });
  }, [isPending, setConfirmationOptions]);

  const isSameParent = moveToTopLevel
    ? unit.parentUnitId === null
    : selectedParentUnit?.id === unit.parentUnitId;

  const isDisabled =
    isSameParent || (!moveToTopLevel && !selectedParentUnit) || isPending;

  const handleConfirmMove = useCallback(() => {
    const targetName = moveToTopLevel
      ? "top level"
      : (selectedParentUnit?.name ?? "");

    setConfirmationOpen({
      title: "Confirm Unit Move",
      message: (
        <span>
          Are you sure you want to move{" "}
          <span className="font-bold">{unit.name}</span>
          {currentParent && (
            <>
              {" "}
              from <span className="font-bold">{currentParent.name}</span>
            </>
          )}{" "}
          to <span className="font-bold">{targetName}</span>?
        </span>
      ),
      onConfirm: () => {
        move();
      },
    });
  }, [
    unit,
    currentParent,
    selectedParentUnit,
    moveToTopLevel,
    setConfirmationOpen,
    move,
  ]);

  return (
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-base font-semibold leading-6 text-gray-900">
        Move Unit
      </h3>
      <div className="mt-2 max-w-md text-sm text-gray-500">
        <p>
          Select a new parent for{" "}
          <span className="font-medium">{unit.name}</span>, or move it to the
          top level.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-4 w-full">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={moveToTopLevel}
            onChange={(e) => setMoveToTopLevel(e.target.checked)}
            className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-600"
          />
          Move to top level (no parent)
        </label>
        <div className="w-full space-y-2">
          <label className="sr-only">Parent Unit Search</label>
          <UnitSelect
            value={selectedParentUnit}
            onChange={(e) => setSelectedParentUnit(e.target?.value ?? null)}
            queryFilter={{ ["organization.id"]: organizationId }}
            filter={excludeFilter}
            disabled={moveToTopLevel}
          />
        </div>
        <button
          type="button"
          onClick={() => handleConfirmMove()}
          className="inline-flex w-full items-center justify-center rounded-md transition-colors bg-primary-600 disabled:opacity-50 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto"
          disabled={isDisabled}
          title={isSameParent ? "The unit is already in this location" : ""}
        >
          Move
        </button>
      </div>
    </div>
  );
};

export default MoveUnitForm;
