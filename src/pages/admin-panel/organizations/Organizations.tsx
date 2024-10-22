import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { ViewLocations } from "./levels/ViewLocations";
import { ViewUnits } from "./levels/ViewUnits";
import { ViewOrganizations } from "./levels/ViewOrganizations";
import { adminPanelPermissionOptions } from "../../../constants/permission-options";

const Organizations: React.FC = withRequirePermissions(() => {
  return (
    <div className="grid gap-24">
      <ViewOrganizations />
      <ViewUnits />
      <ViewLocations />
    </div>
  );
}, adminPanelPermissionOptions);

export default Organizations;
