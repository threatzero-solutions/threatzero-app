import { LEVEL } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { Outlet } from "react-router-dom";
import PageNavBar from "../../components/layouts/PageNavBar";

const navigation = [
  { name: "Organizations", to: "organizations" },
  { name: "Forms", to: "forms" },
  { name: "Resources", to: "resources" },
  { name: "Languages", to: "languages" },
  { name: "Users", to: "users" },
];

const AdminPanel: React.FC = () => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
};

export const adminPanelPermissionOptions = {
  permissions: [LEVEL.ADMIN],
  type: "all" as const,
};

export default withRequirePermissions(AdminPanel, adminPanelPermissionOptions);
