import { Outlet } from "react-router";
import PageNavBar from "../../components/layouts/PageNavBar";
import { adminPanelPermissionOptions } from "../../constants/permission-options";
import { withRequirePermissions } from "../../guards/with-require-permissions";

const navigation = [
  { name: "Organizations", to: "organizations" },
  { name: "Courses", to: "courses" },
  { name: "Forms", to: "forms" },
  { name: "Resources", to: "resources" },
  { name: "Languages", to: "languages" },
  { name: "Advanced", to: "advanced" },
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
