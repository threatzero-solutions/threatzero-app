import { useParams } from "react-router";
import OrganizationsRoot from "../../../organizations/OrganizationsRoot";

const ManageOrganization: React.FC = () => {
  const { id } = useParams();

  return (
    <OrganizationsRoot
      organizationId={id}
      organizationDeleteRedirect={"/admin-panel/organizations"}
    />
  );
};

export default ManageOrganization;
