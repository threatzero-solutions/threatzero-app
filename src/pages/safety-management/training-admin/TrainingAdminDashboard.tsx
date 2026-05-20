import { Outlet } from "react-router";
import { trainingAdminPermissionOptions } from "../../../constants/permission-options";
import { withRequirePermissions } from "../../../guards/with-require-permissions";

const TrainingAdminDashboard: React.FC = withRequirePermissions(() => {
  return <Outlet />;
}, trainingAdminPermissionOptions);

export default TrainingAdminDashboard;
