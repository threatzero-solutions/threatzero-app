/**
 * Slide-over editor for a single user's role grants. Writes to the
 * DB-native access-management API (no Keycloak groups).
 *
 * Two sections:
 *  1. Organization-wide roles — a checkbox list of every role whose
 *     `allowedScopes` includes "organization".
 *  2. Unit-specific roles — a dynamic list of (role, unit) rows. Role
 *     choices are every role whose `allowedScopes` includes "unit".
 *
 * Both lists come from `GET /access/roles` so the FE never hardcodes
 * which roles are grantable at which scope — the backend's `role.scope`
 * enum is the only source of truth.
 *
 * Save performs a replace-with-set PATCH carrying the full desired set.
 * Authority enforcement is server-side; the UI only hides roles the actor
 * can't assign.
 */
import { useContext, useEffect, useMemo, useState } from "react";
import { TrashIcon } from "@heroicons/react/20/solid";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { AssignableRole, UserWithAccess } from "../../../queries/grants";
import {
  useAssignableRoles,
  usePatchUserGrants,
} from "../../../queries/use-grants";

interface UnitGrantRow {
  /** Stable key for React list reconciliation across renders. */
  key: string;
  roleSlug: string;
  unitId: string;
}

export interface RoleAssignmentEditorProps {
  orgId: string;
  user: UserWithAccess | null;
  open: boolean;
  onClose: () => void;
}

export default function RoleAssignmentEditor({
  orgId,
  user,
  open,
  onClose,
}: RoleAssignmentEditorProps) {
  const mutation = usePatchUserGrants(orgId);
  const { allUnits } = useContext(OrganizationsContext);
  const { data: roles, isLoading: rolesLoading } = useAssignableRoles(orgId);

  const orgScopeRoles = useMemo<AssignableRole[]>(
    () => (roles ?? []).filter((r) => r.allowedScopes.includes("organization")),
    [roles],
  );
  const unitScopeRoles = useMemo<AssignableRole[]>(
    () => (roles ?? []).filter((r) => r.allowedScopes.includes("unit")),
    [roles],
  );
  const unitRoleSlugs = useMemo(
    () => new Set(unitScopeRoles.map((r) => r.slug)),
    [unitScopeRoles],
  );

  // Non-default, non-root units in the current org. The "default" unit is a
  // synthetic org-level bucket the API uses internally; exposing it in the
  // unit picker would confuse admins. Sorted by name for predictable order.
  const assignableUnits = useMemo(
    () =>
      (allUnits ?? [])
        .filter((u) => !u.isDefault)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allUnits],
  );

  // Initial ORG-level role slugs (unitId === null).
  const initialOrgRoles = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      user.grants.filter((g) => g.unitId == null).map((g) => g.roleSlug),
    );
  }, [user]);

  // Initial unit-scoped grants as editable rows. A grant whose role isn't in
  // unitRoleSlugs is still preserved on save (we just don't render it as
  // editable); see onSubmit below.
  const initialUnitRows = useMemo<UnitGrantRow[]>(() => {
    if (!user) return [];
    return user.grants
      .filter((g) => g.unitId != null)
      .filter((g) => unitRoleSlugs.has(g.roleSlug))
      .map((g, i) => ({
        key: `initial-${i}`,
        roleSlug: g.roleSlug,
        unitId: g.unitId!,
      }));
  }, [user, unitRoleSlugs]);

  const [selected, setSelected] = useState<Set<string>>(initialOrgRoles);
  const [unitRows, setUnitRows] = useState<UnitGrantRow[]>(initialUnitRows);

  // Reset editor state only when the target user changes identity, not on
  // every user-object reference change. A TanStack Query refetch can hand
  // us a new `user` reference with identical content — if we reset on that,
  // any in-progress edits (e.g., a half-filled unit row the admin just
  // added) get wiped mid-interaction.
  // Use idpId for the effect key — it's stable for a given person even
  // when the backend creates a fresh `userRep` row after first login.
  const userKey = user?.idpId ?? null;
  useEffect(() => {
    setSelected(initialOrgRoles);
    setUnitRows(initialUnitRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const addUnitRow = () => {
    const nextKey = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setUnitRows((prev) => [
      ...prev,
      { key: nextKey, roleSlug: "", unitId: "" },
    ]);
  };

  const updateUnitRow = (key: string, patch: Partial<UnitGrantRow>) =>
    setUnitRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const removeUnitRow = (key: string) =>
    setUnitRows((prev) => prev.filter((r) => r.key !== key));

  const dirty = useMemo(() => {
    if (selected.size !== initialOrgRoles.size) return true;
    for (const s of selected) if (!initialOrgRoles.has(s)) return true;

    if (unitRows.length !== initialUnitRows.length) return true;
    const initialSet = new Set(
      initialUnitRows.map((r) => `${r.roleSlug}:${r.unitId}`),
    );
    for (const r of unitRows) {
      if (!r.roleSlug || !r.unitId) return true;
      if (!initialSet.has(`${r.roleSlug}:${r.unitId}`)) return true;
    }
    return false;
  }, [selected, initialOrgRoles, unitRows, initialUnitRows]);

  // Block save when any unit row is half-filled or has a duplicate
  // (role,unit). Duplicates would be silently deduped by the server but
  // make the UI confusing, so we guard against them here.
  const unitRowsValid = useMemo(() => {
    const seen = new Set<string>();
    for (const r of unitRows) {
      if (!r.roleSlug || !r.unitId) return false;
      const pairKey = `${r.roleSlug}:${r.unitId}`;
      if (seen.has(pairKey)) return false;
      seen.add(pairKey);
    }
    return true;
  }, [unitRows]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Preserve any unit grants for roles outside the unit-scope list (the UI
    // doesn't render them, but the server's replace-with-set semantics
    // would revoke them if we didn't carry them back).
    const preservedUnitGrants = user.grants
      .filter((g) => g.unitId != null)
      .filter((g) => !unitRoleSlugs.has(g.roleSlug))
      .map((g) => ({ roleSlug: g.roleSlug, unitId: g.unitId! }));

    const editableUnitGrants = unitRows.map((r) => ({
      roleSlug: r.roleSlug,
      unitId: r.unitId,
    }));

    const orgGrants = [...selected].map((slug) => ({ roleSlug: slug }));

    // `userId` is the DB `UserRepresentation.id`. Null means the user
    // exists in KC but has never logged in — caller should prevent the
    // editor from opening in that state, but defend here too.
    if (!user.userId) {
      return;
    }

    mutation.mutate(
      {
        userId: user.userId,
        grants: [...orgGrants, ...editableUnitGrants, ...preservedUnitGrants],
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <SlideOver open={open} setOpen={onClose}>
      <SlideOverForm
        onSubmit={onSubmit}
        onClose={onClose}
        hideDelete
        submitText="Save roles"
        submitDisabled={
          !dirty || !unitRowsValid || mutation.isPending || rolesLoading
        }
        isSaving={mutation.isPending}
      >
        <SlideOverHeading
          title="Edit roles"
          description={user?.email ?? ""}
          setOpen={(v) => !v && onClose()}
        />

        <SlideOverFormBody>
          <div className="px-4 py-6 sm:px-6 space-y-8">
            {/* Organization-wide roles */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900">
                Organization-wide roles
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Apply across the whole organization.
              </p>

              {rolesLoading ? (
                <div className="mt-4 h-20 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <ul className="mt-4 space-y-3">
                  {orgScopeRoles.map((r) => {
                    const checked = selected.has(r.slug);
                    return (
                      <li
                        key={r.slug}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-300"
                      >
                        <input
                          id={`role-${r.slug}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(r.slug)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`role-${r.slug}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="block text-sm font-medium text-gray-900">
                            {r.name}
                          </span>
                          {r.description && (
                            <span className="block text-sm text-gray-500">
                              {r.description}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Unit-specific roles */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900">
                Unit-specific roles
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Grant a role scoped to a single unit. Useful for fine-grained
                responsibilities — e.g., a TAT member for one school, or a
                training coordinator over a specific program.
              </p>

              {assignableUnits.length === 0 ? (
                <p
                  className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  role="status"
                >
                  This organization has no units yet — unit-specific grants
                  become available once units are created.
                </p>
              ) : (
                <>
                  <ul className="mt-4 space-y-3">
                    {unitRows.map((row) => (
                      <li
                        key={row.key}
                        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex-1 min-w-[10rem]">
                          <label
                            htmlFor={`unit-role-${row.key}`}
                            className="block text-xs font-medium text-gray-500"
                          >
                            Role
                          </label>
                          <select
                            id={`unit-role-${row.key}`}
                            value={row.roleSlug}
                            onChange={(e) =>
                              updateUnitRow(row.key, {
                                roleSlug: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="">Select role…</option>
                            {unitScopeRoles.map((r) => (
                              <option key={r.slug} value={r.slug}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 min-w-[10rem]">
                          <label
                            htmlFor={`unit-unit-${row.key}`}
                            className="block text-xs font-medium text-gray-500"
                          >
                            Unit
                          </label>
                          <select
                            id={`unit-unit-${row.key}`}
                            value={row.unitId}
                            onChange={(e) =>
                              updateUnitRow(row.key, { unitId: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="">Select unit…</option>
                            {assignableUnits.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeUnitRow(row.key)}
                          aria-label="Remove unit role"
                          className="inline-flex items-center rounded-md p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={addUnitRow}
                    disabled={unitScopeRoles.length === 0}
                    className="mt-3 inline-flex items-center rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add unit role
                  </button>

                  {!unitRowsValid && unitRows.length > 0 && (
                    <p
                      className="mt-3 text-xs text-gray-500"
                      role="status"
                      aria-live="polite"
                    >
                      Each row needs a role and a unit, and pairs must be
                      unique.
                    </p>
                  )}
                </>
              )}
            </section>

            {mutation.isError && (
              <div
                role="alert"
                className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800 ring-1 ring-orange-200"
              >
                Couldn&apos;t save changes. Please try again.
              </div>
            )}
          </div>
        </SlideOverFormBody>
      </SlideOverForm>
    </SlideOver>
  );
}
