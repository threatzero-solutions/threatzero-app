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
  permissions: [
    READ.TIPS,
    READ.THREAT_ASSESSMENTS,
    READ.VIOLENT_INCIDENT_REPORTS,
  ],
};

export default withRequirePermissions(
  ThreatManagementRoot,
  safetyManagementPermissionOptions
);
