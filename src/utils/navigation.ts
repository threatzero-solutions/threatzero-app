import { useCallback } from "react";
import { useMe } from "../contexts/me/MeProvider";
import { NavigationItem } from "../types/core";

export const useNav = () => {
  // Nav items gate on "does the user hold this capability anywhere?" — org
  // OR any granted unit. Unit-only grantees (e.g. a plain 'member' who only
  // has view-training at their unit) would otherwise be invisibly filtered
  // out because `can(cap)` with no unitId is org-wide by design.
  const { canAny } = useMe();

  const canNavigate = useCallback(
    (item: NavigationItem) => {
      if (!item.permissionOptions) {
        return true;
      }

      const { permissions, type = "any" } = item.permissionOptions;
      const predicate = (cap: string) => canAny(cap);
      return type === "all"
        ? permissions.every(predicate)
        : permissions.some(predicate);
    },
    [canAny],
  );

  const filterByPermissions = useCallback(
    (item: NavigationItem): NavigationItem => {
      if (!item.children) {
        return item;
      }
      return {
        ...item,
        children: item.children.filter(canNavigate).map(filterByPermissions),
      };
    },
    [canNavigate],
  );

  return {
    canNavigate,
    filterByPermissions,
  };
};
