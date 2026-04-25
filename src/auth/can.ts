/**
 * Frontend `can()` helper — plain string compares against the capability set
 * returned by `/api/me`. No `@casl/ability` on the client; the API owns the
 * CASL action/subject mapping. See `_docs/authorization-model.md` §2, §3 and
 * `threatzero-api/docs/db-authorization-cutover-plan.md §3.1` for the model.
 *
 * Semantics:
 *   - `can(cap)` — org-wide check within the current scope.
 *     - `scope.kind === 'system'` — all caps pass (system admin bypass).
 *     - `scope.kind === 'tenant'` — checks `capabilities.organization`.
 *     - `scope.kind === 'personal'` — no caps pass.
 *   - `can(cap, { unitId })` — unit-scoped check. Passes if
 *     1. the cap is org-wide (max-scope rule: /me already suppresses the
 *        unit-level entry, so only the org list matters), OR
 *     2. the cap is directly granted at `unitId` in `capabilities.units`, OR
 *     3. an ancestor unit of `unitId` grants the cap (inheritance walked
 *        client-side via `parentUnitId` through a supplied unit index).
 *
 * The backend's `MeService.resolveCapabilities` already applies max-scope
 * along the unit tree (suppressing descendant-unit entries when an ancestor
 * already grants the same cap), so the frontend only needs to walk the
 * `parentUnitId` chain from `unitId` upward and look up each ancestor in
 * `capabilities.units`. Missing ancestors in the unit index are treated as
 * unknown and simply skipped (the caller should provide a complete tree when
 * precision matters).
 */
import { MeResponse } from "../types/me";

/** Minimal unit shape required for ancestor walks. */
export interface UnitTreeNode {
  id: string;
  parentUnitId: string | null;
}

export type UnitTreeIndex =
  | Map<string, UnitTreeNode>
  | Record<string, UnitTreeNode>;

export interface CanOptions {
  /** Unit the check is scoped to. Ancestor units are inspected too. */
  unitId?: string;
  /**
   * Map-like index of the unit tree: unitId → { id, parentUnitId }.
   * Used to resolve ancestor-inherited grants. Supply when a cap may be
   * granted at a parent unit rather than the target unit itself.
   */
  unitTree?: UnitTreeIndex;
}

const lookupUnit = (
  index: UnitTreeIndex | undefined,
  id: string,
): UnitTreeNode | undefined => {
  if (!index) return undefined;
  if (index instanceof Map) return index.get(id);
  return index[id];
};

/**
 * Build a `can()` closure bound to a specific `/me` payload.
 *
 * Returns `false` for any call if `me` is null/undefined — callers should
 * guard on `useMe().isLoading` before relying on gate results.
 */
export const makeCan = (me: MeResponse | null | undefined) => {
  if (!me) return () => false;

  const { scope, capabilities } = me;
  const orgCaps = new Set(capabilities.organization);

  return (capability: string, opts: CanOptions = {}): boolean => {
    // System admins have `manage 'all'` on the API via `manage-system`; on the
    // frontend we treat `scope.kind === 'system'` as an unconditional pass.
    if (scope.kind === "system") return true;
    if (scope.kind === "personal") return false;

    // Org-wide grant wins at any scope (max-scope rule).
    if (orgCaps.has(capability)) return true;

    const { unitId, unitTree } = opts;
    if (!unitId) return false;

    // Direct grant at the target unit.
    const directCaps = capabilities.units[unitId];
    if (directCaps && directCaps.includes(capability)) return true;

    // Walk up parent units. `/me` returns directly-granted unit IDs only;
    // inheritance is resolved here. Guard against cycles with a visited set.
    const visited = new Set<string>([unitId]);
    let current = lookupUnit(unitTree, unitId);
    while (current?.parentUnitId) {
      const parentId = current.parentUnitId;
      if (visited.has(parentId)) break;
      visited.add(parentId);

      const parentCaps = capabilities.units[parentId];
      if (parentCaps && parentCaps.includes(capability)) return true;

      current = lookupUnit(unitTree, parentId);
    }

    return false;
  };
};

export type CanFn = ReturnType<typeof makeCan>;

/**
 * `canAny(cap)` — "is this capability granted anywhere in the user's scope?"
 *
 * Passes when the cap is granted organization-wide OR at any unit the user
 * has a grant at (directly; no ancestor walk — the /me payload already
 * collapses via max-scope). Intended for UX affordances like navigation
 * visibility, where the question is "can the user do this *somewhere*?"
 * rather than "can the user do this at a specific org/unit?" — `can()`
 * remains the right call for the latter.
 *
 * System users pass unconditionally; personal-scope users fail.
 */
export const makeCanAny = (me: MeResponse | null | undefined) => {
  if (!me) return () => false;

  const { scope, capabilities } = me;

  return (capability: string): boolean => {
    if (scope.kind === "system") return true;
    if (scope.kind === "personal") return false;

    if (capabilities.organization.includes(capability)) return true;

    for (const unitCaps of Object.values(capabilities.units)) {
      if (unitCaps.includes(capability)) return true;
    }
    return false;
  };
};

export type CanAnyFn = ReturnType<typeof makeCanAny>;
