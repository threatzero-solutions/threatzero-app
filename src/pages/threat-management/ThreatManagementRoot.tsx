import { READ, WRITE } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { Outlet } from "react-router-dom";
import PageNavBar from "../../components/layouts/PageNavBar";

const navigation = [
  { name: "POC Files", to: "poc-files" },
  { name: "Safety Concerns", to: "safety-concerns" },
  { name: "Threat Assessments", to: "threat-assessments" },
];

const ThreatManagementRoot: React.FC = () => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
};

export const threatManagementPermissionOptions = {
  permissions: [READ.THREAT_ASSESSMENTS, WRITE.THREAT_ASSESSMENTS],
  type: "all" as "all",
};

export default withRequirePermissions(
  ThreatManagementRoot,
  threatManagementPermissionOptions
);
