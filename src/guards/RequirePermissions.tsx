import { Fragment, PropsWithChildren, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth";

export interface RequirePermissionsOptions extends PropsWithChildren {
  type?: "any" | "all";
  permissions: string[];
  fallbackTo?: string;
}

const RequirePermissions: React.FC<RequirePermissionsOptions> = ({
  type,
  permissions,
  fallbackTo,
  children,
}) => {
  const [permissionsSatisfied, setPermissionsSatisfied] = useState<
    boolean | null
  >(null);
  const { hasPermissions } = useAuth();

  useEffect(() => {
    setPermissionsSatisfied(hasPermissions(permissions, type));
  }, [hasPermissions, permissions, type]);

  return permissionsSatisfied !== false ? (
    <Fragment>
      {permissionsSatisfied ? children : <div>Loading...</div>}
    </Fragment>
  ) : (
    <Navigate to={fallbackTo ?? "/"} />
  );
};

export default RequirePermissions;
