import { safetyManagementPermissionOptions } from "../../constants/permission-options";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { Outlet } from "react-router";

const SafetyManagementRoot: React.FC = withRequirePermissions(() => {
  return (
    <>
      <Outlet />
    </>
  );
}, safetyManagementPermissionOptions);

export default SafetyManagementRoot;
