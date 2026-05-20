import { Outlet } from "react-router";
import { adminPanelPermissionOptions } from "../../constants/permission-options";
import { withRequirePermissions } from "../../guards/with-require-permissions";

/**
 * Admin Panel layout shell. Used to render a dark PageNavBar with tabs
 * for Organizations / Courses / Forms / etc., but the chrome rework
 * surfaces those as their own section in the sidebar. The page itself
 * now just renders the active sub-route via Outlet.
 */
const AdminPanel: React.FC = withRequirePermissions(
  () => <Outlet />,
  adminPanelPermissionOptions,
);

export default AdminPanel;
