import { DialogTitle } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
   * The watch-page gate sets this to false (blocking modal); the inline
   * concerns/tips picker — added in phase 4 — will pass true.
   */
  dismissible?: boolean;
  onClose: (result: { picked: MeResidence } | null) => void;
}

const UnitPicker: React.FC<UnitPickerProps> = ({
  open,
  organizationId,
  availableUnits,
  dismissible = true,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { me } = useMe();
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [selected, setSelected] = useState<UnitOption | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Caller-supplied list wins. Otherwise convert the fetched Unit entities
  // into the trimmed shape the picker expects.
  const unitsForPicker = useMemo<UnitOption[]>(() => {
    if (availableUnits && availableUnits.length > 0) return availableUnits;
    return (fetchedUnits ?? []).map((u: Unit) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      parentUnitId: u.parentUnitId ?? null,
    }));
  }, [availableUnits, fetchedUnits]);

  // Build a parent-id → name lookup so the option label can show the
  // parent in light text for context. The plan's UX line ("Hierarchy shown
  // for context") doesn't require a tree widget — a one-level breadcrumb
  // is enough for a first-set decision.
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    unitsForPicker.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [unitsForPicker]);

  // Filter to units the user has any grant on, plus their existing
  // residence unit if already set. Users with org-wide grants see every
  // unit. Users with no grants in this org see nothing — the picker
  // surfaces an empty-state copy in that case.
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

  // Org-wide grants → no unit-scope filter. A user with `manage-org-users`
  // (or any other org-wide capability) is allowed to declare residence
  // anywhere in the org.
  const hasOrgWideGrant = (me?.capabilities?.organization?.length ?? 0) > 0;

  const filteredUnits = useMemo(() => {
    if (hasOrgWideGrant) return unitsForPicker;
    return unitsForPicker.filter((u) => accessibleUnitIds.has(u.id));
  }, [hasOrgWideGrant, unitsForPicker, accessibleUnitIds]);

  const setMutation = useMutation({
    mutationFn: () => {
      if (!selected) {
        return Promise.reject(new Error("No unit selected"));
      }
      return setMyResidence(organizationId, selected.id);
    },
    onSuccess: async (residence) => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      setStep("pick");
      setSelected(null);
      setError(null);
      onClose({ picked: residence });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Could not save residence.";
      setError(message);
    },
  });

  const handleClose = (next: boolean) => {
    if (!dismissible) return;
    if (next) return;
    onClose(null);
  };

  return (
    <Modal
      open={open}
      setOpen={handleClose}
      classNames={{
        dialogPanel: "sm:max-w-xl",
      }}
    >
      <div className="bg-white px-6 pt-6 pb-4 rounded-t-lg">
        <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
          {step === "pick" ? "Pick your unit" : "Confirm your unit"}
        </DialogTitle>
        <p className="mt-2 text-sm text-gray-500">
          {step === "pick"
            ? "Select the unit you belong to inside this organization. This determines where your training progress and submissions are attributed."
            : "Once set, only an administrator can change this. You can pick again if you go back."}
        </p>

        {step === "pick" && (
          <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-gray-100 rounded-md border border-gray-200">
            {filteredUnits.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No units are available for you to pick. Contact an administrator
                to set your residence.
              </p>
            ) : (
              filteredUnits.map((u) => {
                const parentName = u.parentUnitId
                  ? nameById.get(u.parentUnitId)
                  : null;
                const isSelected = selected?.id === u.id;
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={classNames(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3",
                      isSelected ? "bg-primary-50" : "",
                    )}
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        {u.name}
                      </span>
                      {parentName && (
                        <span className="block text-xs text-gray-500">
                          in {parentName}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="h-5 w-5 text-primary-600"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === "confirm" && selected && (
          <div className="mt-4 rounded-md bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              You picked{" "}
              <span className="font-semibold text-gray-900">
                {selected.name}
              </span>
              .
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-b-lg px-6 py-3 flex flex-row-reverse gap-2">
        {step === "pick" ? (
          <>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!selected}
              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-primary-500 disabled:opacity-50"
            >
              Continue
            </button>
            {dismissible && (
              <button
                type="button"
                onClick={() => onClose(null)}
                className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMutation.mutate()}
              disabled={setMutation.isPending}
              className={classNames(
                "inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-primary-500 disabled:opacity-50",
                setMutation.isPending ? "animate-pulse" : "",
              )}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("pick");
              }}
              disabled={setMutation.isPending}
              className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UnitPicker;
