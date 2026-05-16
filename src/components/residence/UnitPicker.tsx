import { DialogTitle } from "@headlessui/react";
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMe } from "../../contexts/me/MeProvider";
import { ME_QUERY_KEY, setMyResidence } from "../../queries/me";
import { getUnits } from "../../queries/organizations";
import { Unit } from "../../types/entities";
import { MeResidence } from "../../types/me";
import { classNames } from "../../utils/core";
import Modal from "../layouts/modal/Modal";

export interface UnitOption {
  id: string;
  slug: string;
  name: string;
  parentUnitId: string | null;
}

export interface UnitPickerProps {
  open: boolean;
  /**
   * Org we're picking residence for. Caller is expected to know this — for
   * the watch-page gate it's the current tenant org; for the
   * RESIDENCE_UNIT_REQUIRED interceptor it's whatever the 422 response
   * payload carried.
   */
  organizationId: string;
  /**
   * Pre-loaded unit options (e.g., from a 422 `availableUnits` payload).
   * When omitted, the picker fetches units for `organizationId` itself.
   */
  availableUnits?: UnitOption[];
  /**
   * Whether the picker can be dismissed without picking. Defaults to true.
   * The watch-page gate sets this to false. Note: regardless of this flag,
   * the "take me to the dashboard" escape link is always present so users
   * never feel trapped inside the modal.
   */
  dismissible?: boolean;
  /**
   * Trigger-specific copy that explains *why* the picker is up right now.
   * Falls back to a generic warm default. Examples:
   *   "Before recording your training, tell us your unit so your progress
   *    is attributed correctly."
   *   "Before submitting your safety concern, tell us your unit so it
   *    reaches the right team."
   */
  reason?: string;
  onClose: (result: { picked: MeResidence } | null) => void;
}

const DEFAULT_REASON = "Tell us where you are most of the time.";

const UnitPicker: React.FC<UnitPickerProps> = ({
  open,
  organizationId,
  availableUnits,
  dismissible = true,
  reason,
  onClose,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { me } = useMe();
  const [selected, setSelected] = useState<UnitOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoAssignedRef = useRef(false);

  const { data: fetchedUnits } = useQuery({
    queryKey: [
      "units",
      {
        "organization.id": organizationId,
        order: { name: "ASC" as const },
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]).then((res) => res.results),
    enabled: open && !availableUnits && !!organizationId,
  });

  const unitsForPicker = useMemo<UnitOption[]>(() => {
    if (availableUnits && availableUnits.length > 0) return availableUnits;
    return (fetchedUnits ?? []).map((u: Unit) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      parentUnitId: u.parentUnitId ?? null,
    }));
  }, [availableUnits, fetchedUnits]);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    unitsForPicker.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [unitsForPicker]);

  const residenceForOrg = me?.residences?.find(
    (r) => r.organizationId === organizationId,
  );
  const accessibleUnitIds = useMemo(() => {
    const ids = new Set<string>();
    Object.keys(me?.capabilities?.units ?? {}).forEach((id) => ids.add(id));
    me?.units?.forEach((u) => ids.add(u.id));
    if (residenceForOrg?.unitId) ids.add(residenceForOrg.unitId);
    return ids;
  }, [me, residenceForOrg]);

  const hasOrgWideGrant = (me?.capabilities?.organization?.length ?? 0) > 0;

  const filteredUnits = useMemo(() => {
    if (hasOrgWideGrant) return unitsForPicker;
    return unitsForPicker.filter((u) => accessibleUnitIds.has(u.id));
  }, [hasOrgWideGrant, unitsForPicker, accessibleUnitIds]);

  const setMutation = useMutation({
    mutationFn: (unitId: string) => setMyResidence(organizationId, unitId),
    onSuccess: async (residence) => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      setSelected(null);
      setError(null);
      onClose({ picked: residence });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Could not save your unit.";
      setError(message);
      // Auto-assign failed — let manual selection take over.
      autoAssignedRef.current = false;
    },
  });

  // FE-side single-unit auto-assign. The backend already auto-assigns for
  // training writes, but this covers any FE-driven pick-flow that didn't
  // go through that path (e.g., interceptor-triggered picker for an
  // endpoint that hasn't been taught the auto-assign rule yet).
  useEffect(() => {
    if (!open) return;
    if (autoAssignedRef.current) return;
    if (filteredUnits.length !== 1) return;
    autoAssignedRef.current = true;
    setSelected(filteredUnits[0]);
    setMutation.mutate(filteredUnits[0].id);
  }, [open, filteredUnits, setMutation]);

  const handleClose = (next: boolean) => {
    if (!dismissible) return;
    if (next) return;
    onClose(null);
  };

  const handleEscape = () => {
    onClose(null);
    navigate("/");
  };

  const showAutoAssigning = autoAssignedRef.current && setMutation.isPending;

  return (
    <Modal
      open={open}
      setOpen={handleClose}
      classNames={{
        dialogPanel: "sm:max-w-xl",
      }}
    >
      <div className="rounded-lg bg-white px-6 pt-7 pb-6 sm:px-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700"
          >
            <BuildingOffice2Icon className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <DialogTitle
              as="h3"
              className="text-lg font-semibold text-gray-900"
            >
              {showAutoAssigning
                ? "Saving your selection"
                : "Where's your home base?"}
            </DialogTitle>
            <p className="mt-1.5 text-sm text-gray-700">
              {showAutoAssigning
                ? `You're being placed in ${selected?.name ?? "the only available option"}.`
                : (reason ?? DEFAULT_REASON)}
            </p>
          </div>
        </div>

        {!showAutoAssigning && (
          <div className="mt-6">
            {filteredUnits.length === 0 ? (
              <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                Nothing's available for you to pick. Contact an administrator to
                get set up.
              </p>
            ) : (
              <ul
                role="radiogroup"
                aria-label="Available options"
                className="grid gap-2"
              >
                {filteredUnits.map((u) => {
                  const parentName = u.parentUnitId
                    ? nameById.get(u.parentUnitId)
                    : null;
                  const isSelected = selected?.id === u.id;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelected(u)}
                        className={classNames(
                          "w-full text-left rounded-lg border px-4 py-3 transition-all duration-150",
                          "active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
                          isSelected
                            ? "border-primary-600 bg-primary-50/60 ring-1 ring-primary-600 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-1 min-w-0">
                            <span
                              className={classNames(
                                "block text-sm font-medium",
                                isSelected
                                  ? "text-primary-900"
                                  : "text-gray-900",
                              )}
                            >
                              {u.name}
                            </span>
                            {parentName && (
                              <span className="mt-0.5 block text-xs text-gray-500">
                                in {parentName}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <CheckCircleIcon
                              aria-hidden="true"
                              className="h-5 w-5 flex-shrink-0 text-primary-600"
                            />
                          )}
                        </div>
                        {isSelected && (
                          <p className="mt-2 text-xs text-primary-900/80">
                            Once set, only an administrator can change this.
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!showAutoAssigning && filteredUnits.length > 0 && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {dismissible && (
              <button
                type="button"
                onClick={() => onClose(null)}
                className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => selected && setMutation.mutate(selected.id)}
              disabled={!selected || setMutation.isPending}
              className={classNames(
                "inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors enabled:hover:bg-primary-500 disabled:opacity-50",
                setMutation.isPending ? "animate-pulse" : "",
              )}
            >
              Save
            </button>
          </div>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4 text-center">
          <button
            type="button"
            onClick={handleEscape}
            className="text-xs text-gray-500 underline-offset-4 hover:text-gray-700 hover:underline"
          >
            Take me back to the dashboard
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnitPicker;
