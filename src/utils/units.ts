import { Unit } from "../types/entities";

/**
 * Collect the slugs (or ids) of a unit and all of its descendants, walking
 * the `parentUnitId` tree. Used to expand a single-unit scope request into
 * the full set the user expects — e.g., selecting a parent unit in the
 * breadcrumb should include everything underneath it.
 *
 * Returns `[rootSlug, ...descendantSlugs]`. If `rootSlug` is not found in
 * `allUnits`, returns just `[rootSlug]` so the caller still has a sensible
 * fallback.
 */
export const getUnitAndDescendantSlugs = (
  allUnits: Unit[] | null | undefined,
  rootSlug: string,
): string[] => {
  if (!allUnits?.length) return [rootSlug];
  const root = allUnits.find((u) => u.slug === rootSlug);
  if (!root) return [rootSlug];

  const childrenByParentId = new Map<string, Unit[]>();
  for (const u of allUnits) {
    if (!u.parentUnitId) continue;
    const bucket = childrenByParentId.get(u.parentUnitId) ?? [];
    bucket.push(u);
    childrenByParentId.set(u.parentUnitId, bucket);
  }

  const out: string[] = [];
  const stack: Unit[] = [root];
  while (stack.length) {
    const u = stack.pop()!;
    out.push(u.slug);
    const children = childrenByParentId.get(u.id);
    if (children) stack.push(...children);
  }
  return out;
};

export const getUnitAndDescendantIds = (
  allUnits: Unit[] | null | undefined,
  rootId: string,
): string[] => {
  if (!allUnits?.length) return [rootId];
  const childrenByParentId = new Map<string, Unit[]>();
  for (const u of allUnits) {
    if (!u.parentUnitId) continue;
    const bucket = childrenByParentId.get(u.parentUnitId) ?? [];
    bucket.push(u);
    childrenByParentId.set(u.parentUnitId, bucket);
  }

  const out: string[] = [];
  const stack: string[] = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    const children = childrenByParentId.get(id);
    if (children) stack.push(...children.map((c) => c.id));
  }
  return out;
};
