import { Unit } from "../../types/entities";

export interface UnitOption {
  id: string;
  /** Hierarchical path label, e.g. "Performix › Nampa". */
  label: string;
}

interface BuildOpts {
  /**
   * Residence rules require a concrete unit; a parent with children isn't
   * a place a user can live. When true, units that are parents of other
   * units are excluded.
   */
  leafOnly?: boolean;
}

/**
 * Produce a sorted, hierarchy-labeled list of unit options.
 *
 * - Parent units render as `"<path> › All Units"` — selecting a parent
 *   implicitly covers everything beneath it, and the "All Units" suffix
 *   keeps that reading explicit at the dropdown.
 * - Leaf units render as their full path only, e.g. `"Performix › Nampa"`.
 * - The synthetic org-wide "default" unit is always excluded; callers
 *   that want org-scope use the dedicated "Across <org>" option.
 */
export function buildUnitOptions(
  units: Unit[],
  { leafOnly = false }: BuildOpts = {},
): UnitOption[] {
  const byId = new Map(units.map((u) => [u.id, u]));
  const hasChildren = new Set<string>();
  for (const u of units) {
    if (u.parentUnitId) hasChildren.add(u.parentUnitId);
  }

  return units
    .filter((u) => !u.isDefault)
    .filter((u) => (leafOnly ? !hasChildren.has(u.id) : true))
    .map((u) => {
      const path: string[] = [];
      let cursor: Unit | undefined = u;
      while (cursor) {
        path.unshift(cursor.name);
        cursor = cursor.parentUnitId
          ? byId.get(cursor.parentUnitId)
          : undefined;
      }
      const base = path.join(" › ");
      const label = hasChildren.has(u.id) ? `${base} › All Units` : base;
      return { id: u.id, label };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Lookup table for hierarchy labels — the list view renders rule sentences
 * like "grant Training Coordinator in Performix › Nampa", matching what
 * the editor shows when authoring.
 */
export function buildUnitLabelMap(units: Unit[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of buildUnitOptions(units)) {
    map.set(option.id, option.label);
  }
  return map;
}
