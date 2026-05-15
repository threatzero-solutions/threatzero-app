/**
 * Move-to-Unit (or Assign-to-Unit) admin action for the merged Users + Access
 * table. Calls `PUT /access/users/:userId/residence`, which the backend
 * cascades over the user's `source='manual'` unit-scoped grants at the old
 * unit (api#59).
 *
 * Two-step modal:
 *   1. Selection — pick the target unit from the assignable list.
 *   2. Confirmation — list which grants will follow, which won't, and a
 *      post-save view once the API responds with the cascade counts.
 *
 * Vocabulary follows the org's `labelPreset` via `OrganizationLabelBundle`:
 * a school org reads "Unit" as "School", a corporate org reads it as "Site".
 * The legacy "residence" word never appears in this surface — admins think
 * in terms of moving a person to a unit, not editing a residence row.
 */
import { DialogTitle } from "@headlessui/react";
import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/layouts/modal/Modal";
import { Unit } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import { OrganizationLabelBundle } from "../../../utils/labels";
import { UserWithAccess } from "../../../queries/grants";
import { useAdminSetUserResidence } from "../../../queries/use-grants";
import { roleChipClass, sortRoleSlugs } from "./roleDisplay";

interface Props {
  orgId: string;
  user: UserWithAccess | null;
  open: boolean;
  onClose: () => void;
  /** Every unit in the org. Filtered internally to assignable ones. */
  units: Unit[];
  labels: OrganizationLabelBundle;
  /** `slug → name` lookup for friendlier copy in the summary. */
  unitNameBySlug: Map<string, string>;
  /** `slug → roleName` lookup so grant chips show role labels, not slugs. */
  roleNameBySlug: Map<string, string>;
}

type Step = "select" | "confirm" | "done";

const MoveUserToUnitModal: React.FC<Props> = ({
  orgId,
  user,
  open,
  onClose,
  units,
  labels,
  unitNameBySlug,
  roleNameBySlug,
}) => {
  const mutation = useAdminSetUserResidence(orgId);

  const [step, setStep] = useState<Step>("select");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [savedCascade, setSavedCascade] = useState<{
    moved: number;
    deduped: number;
  } | null>(null);

  // Whenever the modal closes or the target user changes, reset the
  // multi-step state so reopening on a new row never inherits the last
  // session's selection.
  const userKey = user?.idpId ?? null;
  useEffect(() => {
    setStep("select");
    setSelectedUnitId("");
    setSavedCascade(null);
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, open]);

  const isInitialAssign = !user?.unitSlug;
  const displayName = useMemo(() => {
    if (!user) return "";
    const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return joined || user.email || "this user";
  }, [user]);

  const assignableUnits = useMemo(
    () =>
      (units ?? [])
        .filter((u) => !u.isDefault)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [units],
  );

  // Find the user's current unit row so we can name it in the summary and
  // exclude it from the selection list ("move to where you already are"
  // would be a confusing no-op).
  const currentUnit = useMemo(
    () =>
      user?.unitSlug
        ? (assignableUnits.find((u) => u.slug === user.unitSlug) ?? null)
        : null,
    [assignableUnits, user?.unitSlug],
  );

  const selectableUnits = useMemo(
    () =>
      assignableUnits.filter((u) => !currentUnit || u.id !== currentUnit.id),
    [assignableUnits, currentUnit],
  );

  const targetUnit = useMemo(
    () => assignableUnits.find((u) => u.id === selectedUnitId) ?? null,
    [assignableUnits, selectedUnitId],
  );

  // Manual grants the user holds at the current unit. These will cascade
  // with the move per api#59 (the backend filters to source='manual' and
  // `UserWithAccess.grants` already excludes SSO/rule rows). Org-scoped
  // grants stay put, and grants at other units are independent.
  const grantBreakdown = useMemo<{
    willMove: UserWithAccess["grants"];
    willStay: UserWithAccess["grants"];
  }>(() => {
    if (!user) return { willMove: [], willStay: [] };
    const willMove = currentUnit
      ? user.grants.filter((g) => g.unitId === currentUnit.id)
      : [];
    const willStay = currentUnit
      ? user.grants.filter((g) => g.unitId !== currentUnit.id)
      : user.grants;
    return { willMove, willStay };
  }, [user, currentUnit]);

  const onConfirm = () => {
    if (!user?.userId || !targetUnit) return;
    mutation.mutate(
      { userId: user.userId, unitId: targetUnit.id },
      {
        onSuccess: (result) => {
          setSavedCascade(result.cascade);
          setStep("done");
        },
      },
    );
  };

  if (!user) return null;

  const unitLabelLower = labels.unitSingular.toLowerCase();
  const actionLabel = isInitialAssign
    ? `Assign to ${unitLabelLower}`
    : `Move to ${unitLabelLower}`;

  return (
    <Modal
      open={open}
      setOpen={(v) => {
        if (!v) onClose();
      }}
      classNames={{ dialogPanel: "sm:max-w-xl" }}
    >
      <div className="bg-white px-5 pb-5 pt-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className={classNames(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              step === "done" ? "bg-primary-50" : "bg-secondary-100",
            )}
          >
            {step === "done" ? (
              <CheckCircleIcon
                aria-hidden="true"
                className="h-5 w-5 text-primary-600"
              />
            ) : (
              <ArrowsRightLeftIcon
                aria-hidden="true"
                className="h-5 w-5 text-secondary-600"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              {step === "select" && (
                <>
                  {actionLabel}
                  <span className="mt-0.5 block truncate text-sm font-normal text-gray-500">
                    {displayName}
                    {user.email ? ` (${user.email})` : ""}
                  </span>
                </>
              )}
              {step === "confirm" &&
                (isInitialAssign ? "Confirm assignment" : "Confirm move")}
              {step === "done" &&
                (isInitialAssign ? "Assignment complete" : "Move complete")}
            </DialogTitle>

            <div className="mt-3 space-y-3 text-sm text-gray-700">
              {step === "select" && (
                <SelectStep
                  labels={labels}
                  isInitialAssign={isInitialAssign}
                  currentUnitName={
                    currentUnit?.name ??
                    (user.unitSlug
                      ? unitNameBySlug.get(user.unitSlug)
                      : null) ??
                    null
                  }
                  selectableUnits={selectableUnits}
                  selectedUnitId={selectedUnitId}
                  onSelect={setSelectedUnitId}
                />
              )}

              {step === "confirm" && targetUnit && (
                <ConfirmStep
                  displayName={displayName}
                  labels={labels}
                  isInitialAssign={isInitialAssign}
                  currentUnitName={currentUnit?.name ?? null}
                  targetUnitName={targetUnit.name}
                  willMove={grantBreakdown.willMove}
                  willStay={grantBreakdown.willStay}
                  roleNameBySlug={roleNameBySlug}
                  unitNameBySlug={unitNameBySlug}
                  isPending={mutation.isPending}
                  isError={mutation.isError}
                />
              )}

              {step === "done" && targetUnit && savedCascade && (
                <DoneStep
                  displayName={displayName}
                  labels={labels}
                  isInitialAssign={isInitialAssign}
                  targetUnitName={targetUnit.name}
                  cascade={savedCascade}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-b-lg px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3 sm:gap-0">
        {step === "select" && (
          <>
            <button
              type="button"
              disabled={!selectedUnitId}
              onClick={() => setStep("confirm")}
              className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-primary-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
            >
              Review
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onConfirm}
              className={classNames(
                "inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs enabled:hover:bg-primary-500 disabled:opacity-50 sm:ml-3 sm:w-auto",
                mutation.isPending ? "animate-pulse" : "",
              )}
            >
              {isInitialAssign ? "Assign" : "Move"} {displayName.split(" ")[0]}
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => setStep("select")}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 enabled:hover:bg-gray-50 disabled:opacity-50 sm:mt-0 sm:w-auto"
            >
              Back
            </button>
          </>
        )}

        {step === "done" && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto"
          >
            Done
          </button>
        )}
      </div>
    </Modal>
  );
};

interface SelectStepProps {
  labels: OrganizationLabelBundle;
  isInitialAssign: boolean;
  currentUnitName: string | null;
  selectableUnits: Unit[];
  selectedUnitId: string;
  onSelect: (id: string) => void;
}

const SelectStep: React.FC<SelectStepProps> = ({
  labels,
  isInitialAssign,
  currentUnitName,
  selectableUnits,
  selectedUnitId,
  onSelect,
}) => {
  if (selectableUnits.length === 0) {
    return (
      <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
        No other {labels.unitPlural.toLowerCase()} are available in this
        organization yet.
      </p>
    );
  }

  return (
    <div>
      <label
        htmlFor="move-to-unit"
        className="block text-sm font-medium text-gray-700"
      >
        {isInitialAssign || !currentUnitName ? (
          <>
            {isInitialAssign
              ? `Which ${labels.unitSingular.toLowerCase()}?`
              : `New ${labels.unitSingular.toLowerCase()}`}
          </>
        ) : (
          <>
            From{" "}
            <span className="font-semibold text-gray-900">
              {currentUnitName}
            </span>{" "}
            to
          </>
        )}
      </label>
      <select
        id="move-to-unit"
        value={selectedUnitId}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-1.5 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
      >
        <option value="">Select…</option>
        {selectableUnits.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ConfirmStepProps {
  displayName: string;
  labels: OrganizationLabelBundle;
  isInitialAssign: boolean;
  currentUnitName: string | null;
  targetUnitName: string;
  willMove: UserWithAccess["grants"];
  willStay: UserWithAccess["grants"];
  roleNameBySlug: Map<string, string>;
  unitNameBySlug: Map<string, string>;
  isPending: boolean;
  isError: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  displayName,
  labels,
  isInitialAssign,
  currentUnitName,
  targetUnitName,
  willMove,
  willStay,
  roleNameBySlug,
  unitNameBySlug,
  isPending,
  isError,
}) => {
  const willMoveSlugs = sortRoleSlugs(willMove.map((g) => g.roleSlug));
  return (
    <>
      <p className="text-gray-700">
        {isInitialAssign ? (
          <>
            Assigning{" "}
            <span className="font-semibold text-gray-900">{displayName}</span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900">
              {targetUnitName}
            </span>
            .
          </>
        ) : (
          <>
            Moving{" "}
            <span className="font-semibold text-gray-900">{displayName}</span>{" "}
            from{" "}
            <span className="font-semibold text-gray-900">
              {currentUnitName ?? "—"}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900">
              {targetUnitName}
            </span>
            .
          </>
        )}
      </p>

      {willMove.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Roles that will follow
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {willMoveSlugs.map((slug) => (
              <span
                key={slug}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleChipClass(slug)}`}
              >
                {roleNameBySlug.get(slug) ?? slug}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Each role assigned at {currentUnitName} will re-anchor to{" "}
            {targetUnitName}.
          </p>
        </section>
      )}

      {willStay.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Roles that won&apos;t change
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            {willStay.map((g, i) => {
              const roleName = roleNameBySlug.get(g.roleSlug) ?? g.roleSlug;
              const scope = g.unitSlug
                ? `${labels.unitSingular} ${unitNameBySlug.get(g.unitSlug) ?? g.unitSlug}`
                : "Organization-wide";
              return (
                <li
                  key={`${g.roleSlug}:${g.unitId ?? "org"}:${i}`}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${roleChipClass(g.roleSlug)}`}
                  >
                    {roleName}
                  </span>
                  <span className="text-gray-500">{scope}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {willMove.length === 0 && willStay.length === 0 && (
        <p className="text-xs text-gray-500">
          {displayName} has no manual role assignments — only the{" "}
          {labels.unitSingular.toLowerCase()} assignment will change.
        </p>
      )}

      {isPending && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs italic text-gray-500"
        >
          Saving…
        </p>
      )}

      {isError && (
        <p
          role="alert"
          className="rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800 ring-1 ring-orange-200"
        >
          Couldn&apos;t complete the {isInitialAssign ? "assignment" : "move"}.
          Please try again.
        </p>
      )}
    </>
  );
};

interface DoneStepProps {
  displayName: string;
  labels: OrganizationLabelBundle;
  isInitialAssign: boolean;
  targetUnitName: string;
  cascade: { moved: number; deduped: number };
}

const DoneStep: React.FC<DoneStepProps> = ({
  displayName,
  labels,
  isInitialAssign,
  targetUnitName,
  cascade,
}) => {
  const grantsFollowed = cascade.moved + cascade.deduped;
  const summary = isInitialAssign
    ? `${displayName} is now in ${targetUnitName}.`
    : `${displayName} moved to ${targetUnitName}.`;
  return (
    <>
      <p className="text-gray-800">{summary}</p>
      {grantsFollowed > 0 ? (
        <p className="text-xs text-gray-600">
          {cascade.moved > 0 && (
            <>
              <strong>{cascade.moved}</strong> role
              {cascade.moved === 1 ? "" : "s"} re-anchored to {targetUnitName}
              {cascade.deduped > 0 ? ". " : "."}
            </>
          )}
          {cascade.deduped > 0 && (
            <>
              <strong>{cascade.deduped}</strong> already existed at{" "}
              {targetUnitName} and were left in place.
            </>
          )}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          No {labels.unitSingular.toLowerCase()}-scoped roles needed to move.
        </p>
      )}
    </>
  );
};

export default MoveUserToUnitModal;
