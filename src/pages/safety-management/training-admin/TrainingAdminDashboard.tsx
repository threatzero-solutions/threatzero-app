import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { Outlet } from "react-router";
import PageNavBar from "../../../components/layouts/PageNavBar";
import { trainingAdminPermissionOptions } from "../../../constants/permission-options";

const navigation = [
  { name: "Completions", to: "completions" },
  { name: "Invites", to: "invites" },
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
