import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import { saveOrganizationUser } from "../../../queries/organizations";
import { OrganizationUser } from "../../../types/api";
import { Unit } from "../../../types/entities";

interface MoveUnitsFormProps {
  organizationId: string;
  user: OrganizationUser;
  setOpen: (open: boolean) => void;
}

const MoveUnitsForm: React.FC<MoveUnitsFormProps> = ({
  organizationId,
  user,
  setOpen,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const {
    setOpen: setConfirmationOpen,
    setClose: setConfirmationClose,
    setConfirmationOptions,
  } = useContext(ConfirmationContext);
  const { allUnits, invalidateOrganizationUsersQuery } = useContext(
    MyOrganizationContext
  );

  const previousUnit = useMemo(
    () => allUnits?.find((u) => u.slug === user.attributes.unit?.[0]),
    [allUnits, user]
  );

  useEffect(() => {
    if (previousUnit) {
      setSelectedUnit(previousUnit);
    }
  }, [previousUnit]);

  useEffect(() => {
    return () => {
      setSelectedUnit(null);
    };
  }, []);

  const { mutate: move, isPending } = useMutation({
    mutationFn: (user: Partial<OrganizationUser>) =>
      saveOrganizationUser(organizationId, user),
    onSuccess: () => {
      invalidateOrganizationUsersQuery([
        user.attributes.unit?.[0],
        selectedUnit?.slug,
      ]);
      setConfirmationClose();
      setOpen(false);
    },
  });

  useEffect(() => {
    setConfirmationOptions((options) => {
      options.isPending = isPending;
    });
  }, [isPending, setConfirmationOptions]);

  const handleMove = useCallback(() => {
    if (selectedUnit) {
      move({
        id: user.id,
        attributes: {
          unit: [selectedUnit.slug],
        },
      });
    }
  }, [move, selectedUnit, user]);

  const handleMoveUnits = useCallback(() => {
    if (selectedUnit) {
      setConfirmationOpen({
        title: "Confirm Unit Move",
        message: (
          <span>
            Are you sure you want to move{" "}
            <span className="font-bold">
              {user.firstName} {user.lastName}
            </span>{" "}
            {previousUnit && (
              <>
                from <span className="font-bold">{previousUnit.name} </span>
              </>
            )}
            to <span className="font-bold">{selectedUnit.name}</span>?
          </span>
        ),
        onConfirm: () => {
          handleMove();
        },
      });
    }
  }, [user, selectedUnit, setConfirmationOpen, handleMove, previousUnit]);

  return (
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-base font-semibold leading-6 text-gray-900">
        Move User to Another Unit
      </h3>
      <div className="mt-2 max-w-md text-sm text-gray-500">
        <p>Search for unit by name.</p>
      </div>
      <div className="mt-5 flex flex-col gap-4 w-full">
        <div className="w-full space-y-2">
          <label htmlFor="idp-alias" className="sr-only">
            Unit Search
          </label>
          <UnitSelect
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target?.value ?? null)}
            queryFilter={{ ["organization.id"]: organizationId }}
          />
        </div>
        <button
          type="button"
          onClick={() => handleMoveUnits()}
          className="inline-flex w-full items-center justify-center rounded-md transition-colors bg-secondary-600 disabled:opacity-50 px-3 py-2 text-sm font-semibold text-white shadow-sm enabled:hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 sm:w-auto"
          disabled={!selectedUnit || selectedUnit.slug === previousUnit?.slug}
          title={
            selectedUnit?.slug === previousUnit?.slug
              ? "The user is already in this unit"
              : ""
          }
        >
          Move
        </button>
      </div>
    </div>
  );
};

export default MoveUnitsForm;
