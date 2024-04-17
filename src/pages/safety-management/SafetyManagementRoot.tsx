import { READ } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { Outlet } from "react-router-dom";

const ThreatManagementRoot: React.FC = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export const safetyManagementPermissionOptions = {
  permissions: [READ.SAFETY_MANAGEMENT_RESOURCES],
};

export default withRequirePermissions(
  ThreatManagementRoot,
  safetyManagementPermissionOptions
);
