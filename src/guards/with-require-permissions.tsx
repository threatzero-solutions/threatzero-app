import { ComponentType } from "react";
import RequirePermissions, {
  RequirePermissionsOptions,
} from "./RequirePermissions";

export const withRequirePermissions = <P extends object>(
  Component: ComponentType<P>,
  options: RequirePermissionsOptions
): React.FC<P> => {
  return (props: P) =>
    RequirePermissions({
      ...options,
      children: <Component {...props} />,
    });
};
