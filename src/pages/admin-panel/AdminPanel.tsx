import { withRequirePermissions } from "../../guards/with-require-permissions";
import { Outlet } from "react-router-dom";
import PageNavBar from "../../components/layouts/PageNavBar";
import { adminPanelPermissionOptions } from "../../constants/permission-options";

const navigation = [
  { name: "Organizations", to: "organizations" },
  { name: "Forms", to: "forms" },
  { name: "Resources", to: "resources" },
  { name: "Languages", to: "languages" },
  { name: "Users", to: "users" },
];

const AdminPanel: React.FC = withRequirePermissions(() => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
}, adminPanelPermissionOptions);

export default AdminPanel;
