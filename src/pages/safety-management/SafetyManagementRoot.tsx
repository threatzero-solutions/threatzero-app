import { READ, WRITE } from "../../constants/permissions";
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
  permissions: [READ.THREAT_ASSESSMENTS, WRITE.THREAT_ASSESSMENTS],
  type: "all" as "all",
};

export default withRequirePermissions(
  ThreatManagementRoot,
  safetyManagementPermissionOptions
);
