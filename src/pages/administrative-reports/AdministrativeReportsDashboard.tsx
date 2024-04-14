import { READ } from "../../constants/permissions";
import {
  RequirePermissionsOptions,
  withRequirePermissions,
} from "../../guards/RequirePermissions";
import { Link } from "react-router-dom";

const AdministrativeReportsDashboard: React.FC = () => {
  return (
    <div className={"space-y-12"}>
      <p>
        Safety concerns can now be viewed at{" "}
        <Link
          to="/safety-management/safety-concerns"
          className="text-secondary-600 hover:text-secondary-700 transition-colors"
        >
          Safety Management &gt; Safety Concerns
        </Link>
        .
      </p>
    </div>
  );
};

export const administrativeReportsDashboardPermissionsOptions: RequirePermissionsOptions =
  {
    permissions: [READ.TIPS],
    type: "all",
  };

export default withRequirePermissions(
  AdministrativeReportsDashboard,
  administrativeReportsDashboardPermissionsOptions
);
