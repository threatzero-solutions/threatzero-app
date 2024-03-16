import { READ, LEVEL } from "../../../constants/permissions";
import { withRequirePermissions } from "../../../guards/RequirePermissions";
import { ViewLocations } from "./levels/ViewLocations";
import { ViewUnits } from "./levels/ViewUnits";
import { ViewOrganizations } from "./levels/ViewOrganizations";

const Organizations: React.FC = () => {
	return (
		<div className="grid gap-24">
			<ViewOrganizations />
			<ViewUnits />
			<ViewLocations />
		</div>
	);
};

export const adminPanelPermissionOptions = {
	permissions: [LEVEL.ADMIN, READ.ORGANIZATIONS],
	type: "all" as "all",
};

export default withRequirePermissions(
	Organizations,
	adminPanelPermissionOptions,
);
