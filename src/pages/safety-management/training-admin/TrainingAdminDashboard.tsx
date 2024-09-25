import { READ, WRITE } from "../../../constants/permissions";
import { withRequirePermissions } from "../../../guards/RequirePermissions";
import { Outlet } from "react-router-dom";
import PageNavBar from "../../../components/layouts/PageNavBar";

const navigation = [
  { name: "Watch Stats", to: "watch-stats" },
  { name: "Invites", to: "invites" },
];

const TrainingAdminDashboard: React.FC = () => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
};

export const trainingAdminPermissionOptions = {
  permissions: [WRITE.TRAINING_LINKS, READ.TRAINING_STATS],
  type: "all" as const,
};

export default withRequirePermissions(
  TrainingAdminDashboard,
  trainingAdminPermissionOptions
);
