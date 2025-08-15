import { Outlet } from "react-router";
import PageNavBar from "../../../components/layouts/PageNavBar";
import { trainingAdminPermissionOptions } from "../../../constants/permission-options";
import { READ, WRITE } from "../../../constants/permissions";
import { withRequirePermissions } from "../../../guards/with-require-permissions";

const navigation = [
  {
    name: "Completions",
    to: "completions",
    permissionOptions: { permissions: [READ.TRAINING_STATS] },
  },
  {
    name: "Invites",
    to: "invites",
    permissionOptions: { permissions: [WRITE.TRAINING_LINKS] },
  },
];

const TrainingAdminDashboard: React.FC = withRequirePermissions(() => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
}, trainingAdminPermissionOptions);

export default TrainingAdminDashboard;
