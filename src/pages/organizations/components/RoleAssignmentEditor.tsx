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
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { useMe } from "../../../contexts/me/MeProvider";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  AssignableRole,
  GrantSource,
  ShadowedRevoke,
  UserWithAccess,
} from "../../../queries/grants";
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

function derivedSourceLabel(source: GrantSource | undefined): string {
  return source === "sso" ? "SSO" : "Rule";
}

function derivedSourceTooltip(source: GrantSource | undefined): string {
  return source === "sso"
    ? "Granted by your IDP — edit the IDP configuration to change."
    : "Granted by an access rule — edit the rule to change.";
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
  const { isGlobalAdmin } = useMe();
  // Reveal the read-only system-admin callout only when (a) the target
  // user actually holds it AND (b) the viewer is themselves a system
  // admin. Org-admins shouldn't even know whether someone has the
  // role — that's the whole reason management lives in a separate
  // surface and the org module only ever sees a hidden flag.
  const showSystemAdminNotice = !!user?.isSystemAdmin && isGlobalAdmin;

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

  // Sorted by name for predictable order in the unit picker.
  const assignableUnits = useMemo(
    () => [...(allUnits ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [allUnits],
  );

  // Split the user's grants into manual (editable) and derived (rule/sso,
  // read-only). Derived grants are projections of an upstream source — the
  // API rejects direct mutation, and even if it didn't the source would
  // re-materialize on next eval. We surface them so the admin sees the
  // user's full effective access, but render the controls disabled.
  const { derivedOrgRoles, derivedUnitGrants } = useMemo(() => {
    const orgRoles = new Map<string, GrantSource>(); // roleSlug → source
    const unitGrants: Array<{
      roleSlug: string;
      unitId: string;
      unitSlug: string | null;
      source: GrantSource;
    }> = [];
    if (!user)
      return { derivedOrgRoles: orgRoles, derivedUnitGrants: unitGrants };
    for (const g of user.grants) {
      if (g.source === "manual") continue;
      if (g.unitId == null) {
        orgRoles.set(g.roleSlug, g.source);
      } else {
        unitGrants.push({
          roleSlug: g.roleSlug,
          unitId: g.unitId,
          unitSlug: g.unitSlug,
          source: g.source,
        });
      }
    }
    return { derivedOrgRoles: orgRoles, derivedUnitGrants: unitGrants };
  }, [user]);

  // Initial ORG-level role slugs (unitId === null), MANUAL only. Rule/SSO
  // grants are tracked separately in `derivedOrgRoles` and rendered as
  // disabled checkboxes — they don't enter the dirty-state set or the
  // submit payload.
  const initialOrgRoles = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      user.grants
        .filter((g) => g.source === "manual")
        .filter((g) => g.unitId == null)
        .map((g) => g.roleSlug),
    );
  }, [user]);

  // Initial unit-scoped MANUAL grants as editable rows. Rule/SSO unit
  // grants are tracked separately in `derivedUnitGrants` and rendered as
  // a read-only list. A manual grant whose role isn't in unitRoleSlugs is
  // still preserved on save (we just don't render it as editable); see
  // onSubmit below.
  const initialUnitRows = useMemo<UnitGrantRow[]>(() => {
    if (!user) return [];
    return user.grants
      .filter((g) => g.source === "manual")
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
  // Server-flagged shadowed revokes from the last save. When non-empty, the
  // slide-over stays open after save so the admin can read the warning; they
  // dismiss with the "Done" button. Cleared on each new submit.
  const [shadowedRevokes, setShadowedRevokes] = useState<ShadowedRevoke[]>([]);

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
    setShadowedRevokes([]);
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

    // Preserve any MANUAL unit grants for roles outside the unit-scope
    // list — the UI doesn't render them as editable rows, but the
    // server's replace-with-set semantics would revoke them if we didn't
    // carry them back. Rule/SSO grants are NOT carried back: the PATCH
    // endpoint only manages source='manual' rows, and the API would
    // either reject the foreign sources or silently re-materialize them.
    const preservedUnitGrants = user.grants
      .filter((g) => g.source === "manual")
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

    setShadowedRevokes([]);
    mutation.mutate(
      {
        userId: user.userId,
        grants: [...orgGrants, ...editableUnitGrants, ...preservedUnitGrants],
      },
      {
        onSuccess: (result) => {
          // Keep the slide-over open when the server flagged shadowed
          // revokes so the admin sees the warning. They dismiss with the
          // explicit "Done" button below. Clean save → close immediately.
          if (result.shadowedRevokes.length > 0) {
            setShadowedRevokes(result.shadowedRevokes);
          } else {
            onClose();
          }
        },
      },
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
            {shadowedRevokes.length > 0 && (
              <section
                aria-label="Shadowed revoke warning"
                className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-300"
              >
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-amber-600"
                />
                <div className="min-w-0 text-sm">
                  <div className="font-semibold text-amber-900">
                    Saved, but some roles are still granted automatically
                  </div>
                  <p className="mt-1 text-amber-900/80">
                    You removed the following manual role
                    {shadowedRevokes.length === 1 ? "" : "s"}, but{" "}
                    {shadowedRevokes.length === 1 ? "it is" : "they are"} still
                    granted from another source and will re-apply on the
                    user&apos;s next login. To fully revoke, edit the underlying
                    access rule (or upstream IDP configuration for SSO-sourced
                    grants).
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900/90">
                    {shadowedRevokes.map((s, i) => (
                      <li key={`${s.roleSlug}:${s.unitSlug ?? ""}:${i}`}>
                        <span className="font-medium">
                          {s.roleName || s.roleSlug}
                        </span>
                        {s.unitSlug ? (
                          <>
                            {" "}
                            at unit{" "}
                            <span className="font-medium">{s.unitSlug}</span>
                          </>
                        ) : null}{" "}
                        <span className="text-amber-900/70">
                          (via {s.shadowedBy})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {showSystemAdminNotice && (
              <section
                aria-label="System administrator"
                className="flex items-start gap-3 rounded-lg bg-primary-50/70 p-4 ring-1 ring-primary-200/70"
              >
                <ShieldCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary-600"
                />
                <div className="min-w-0 text-sm">
                  <div className="font-semibold text-primary-900">
                    System administrator
                  </div>
                  <p className="mt-1 text-primary-900/80">
                    This person holds the system-administrator role and can read
                    and edit every organization. The role is managed centrally
                    in{" "}
                    <span className="font-medium">
                      Admin Panel → System admins
                    </span>{" "}
                    and isn&apos;t editable from this view.
                  </p>
                </div>
              </section>
            )}

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
                    const derivedSource = derivedOrgRoles.get(r.slug);
                    const hasDerived = derivedSource !== undefined;
                    // The user's editor opened with the role manually set.
                    // Tells us whether the checkbox represents an existing
                    // manual grant that can still be toggled off even when
                    // a derived overlay (rule/sso) also grants the role.
                    const initialHadManual = initialOrgRoles.has(r.slug);
                    // The checkbox is interactive when there's a manual to
                    // manage. With only a derived overlay there's nothing
                    // for this control to do — the rule/sso source grants
                    // the role regardless and can't be revoked here.
                    const checkboxDisabled = hasDerived && !initialHadManual;
                    const checked = checkboxDisabled
                      ? true
                      : selected.has(r.slug);
                    // Tooltip mode varies: derived-only emphasizes the
                    // source; "both" hints that toggling only affects the
                    // redundant manual grant (the derived layer remains).
                    const tooltip = checkboxDisabled
                      ? derivedSourceTooltip(derivedSource)
                      : hasDerived
                        ? `Also granted by ${derivedSourceLabel(derivedSource).toLowerCase()} — toggling here only removes the redundant manual grant.`
                        : undefined;
                    return (
                      <li
                        key={r.slug}
                        className={`flex items-start gap-3 rounded-lg border border-gray-200 p-4 ${
                          checkboxDisabled
                            ? "bg-gray-50"
                            : "hover:border-gray-300"
                        }`}
                        title={tooltip}
                      >
                        <input
                          id={`role-${r.slug}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() => !checkboxDisabled && toggle(r.slug)}
                          disabled={checkboxDisabled}
                          aria-describedby={
                            hasDerived ? `role-${r.slug}-source` : undefined
                          }
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <label
                          htmlFor={`role-${r.slug}`}
                          className={`flex-1 ${
                            checkboxDisabled
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            {r.name}
                            {hasDerived && (
                              <span
                                id={`role-${r.slug}-source`}
                                className="inline-flex items-center rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-700 ring-1 ring-primary-200"
                              >
                                {derivedSourceLabel(derivedSource)}
                              </span>
                            )}
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
                  {derivedUnitGrants.length > 0 && (
                    <ul
                      className="mt-4 space-y-3"
                      aria-label="Unit roles granted by rules or SSO"
                    >
                      {derivedUnitGrants.map((g, i) => (
                        <li
                          key={`derived-${g.roleSlug}-${g.unitId}-${i}`}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
                          title={derivedSourceTooltip(g.source)}
                        >
                          <div className="flex-1 min-w-[10rem] text-sm">
                            <span className="block text-xs font-medium text-gray-500">
                              Role
                            </span>
                            <span className="mt-1 inline-flex items-center gap-2 text-gray-900">
                              {unitScopeRoles.find((r) => r.slug === g.roleSlug)
                                ?.name ?? g.roleSlug}
                              <span className="inline-flex items-center rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-700 ring-1 ring-primary-200">
                                {derivedSourceLabel(g.source)}
                              </span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-[10rem] text-sm">
                            <span className="block text-xs font-medium text-gray-500">
                              Unit
                            </span>
                            <span className="mt-1 block text-gray-900">
                              {assignableUnits.find((u) => u.id === g.unitId)
                                ?.name ??
                                g.unitSlug ??
                                "(unknown unit)"}
                            </span>
                          </div>
                          {/* No remove button — derived grants are not directly
                              revocable. Admin edits the rule/IDP to change. */}
                        </li>
                      ))}
                    </ul>
                  )}
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
