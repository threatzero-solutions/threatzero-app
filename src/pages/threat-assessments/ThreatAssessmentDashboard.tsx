import { READ } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { Link } from "react-router-dom";

const ThreatAssessmentDashboard: React.FC = () => {
  return (
    <div className={"space-y-12"}>
      <p>
        Threat assessments can now be viewed at{" "}
        <Link
          to="/safety-management/threat-assessments"
          className="text-secondary-600 hover:text-secondary-700 transition-colors"
        >
          Safety Management &gt; Threat Assessments
        </Link>
        .
      </p>
    </div>
  );
};

export const threatAssessmentPermissionsOptions = {
  permissions: [READ.SAFETY_MANAGEMENT_RESOURCES],
};

export default withRequirePermissions(
  ThreatAssessmentDashboard,
  threatAssessmentPermissionsOptions
);
