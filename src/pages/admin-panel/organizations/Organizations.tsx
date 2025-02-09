import { adminPanelPermissionOptions } from "../../../constants/permission-options";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { ViewOrganizations } from "./levels/ViewOrganizations";

const Organizations: React.FC = withRequirePermissions(() => {
  return (
    <div className="grid gap-24">
      <ViewOrganizations />
    </div>
  );
}, adminPanelPermissionOptions);

export default Organizations;
