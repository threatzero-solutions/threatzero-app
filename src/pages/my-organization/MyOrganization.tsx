import { withRequirePermissions } from "../../guards/with-require-permissions";
import { Outlet } from "react-router-dom";
import PageNavBar from "../../components/layouts/PageNavBar";
import { myOrganizationPermissionOptions } from "../../constants/permission-options";

const navigation = [
  { name: "Home", to: "home" },
  { name: "Users", to: "users" },
];

const MyOrganization: React.FC = withRequirePermissions(() => {
  return (
    <>
      <PageNavBar navigation={navigation} />
      <Outlet />
    </>
  );
}, myOrganizationPermissionOptions);

export default MyOrganization;
