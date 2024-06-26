import { useCallback } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { NavigationItem } from "../types/core";

export const useNav = () => {
  const { hasPermissions } = useAuth();

  const canNavigate = useCallback(
    (item: NavigationItem) => {
      if (!item.permissionOptions) {
        return true;
      }

      return hasPermissions(
        item.permissionOptions.permissions,
        item.permissionOptions.type
      );
    },
    [hasPermissions]
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
    [canNavigate]
  );

  return {
    canNavigate,
    filterByPermissions,
  };
};
