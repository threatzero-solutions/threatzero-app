import { useCallback } from "react";
import { useMe } from "../contexts/me/MeProvider";
import { NavigationItem } from "../types/core";

export const useNav = () => {
  const { can } = useMe();

  const canNavigate = useCallback(
    (item: NavigationItem) => {
      if (!item.permissionOptions) {
        return true;
      }

      const { permissions, type = "any" } = item.permissionOptions;
      const predicate = (cap: string) => can(cap);
      return type === "all"
        ? permissions.every(predicate)
        : permissions.some(predicate);
    },
    [can],
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
