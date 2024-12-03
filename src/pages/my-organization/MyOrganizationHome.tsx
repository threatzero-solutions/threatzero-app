import { useAuth } from "../../contexts/auth/useAuth";
import OrganizationUnitOverview from "./components/OrganizationUnitOverview";

const MyOrganizationHome = () => {
  const { accessTokenClaims } = useAuth();

  return (
    <div>
      <OrganizationUnitOverview
        organizationId={
          accessTokenClaims?.organization
            ? `${accessTokenClaims?.organization}`
            : null
        }
        organizationIdType="slug"
        unitsRoot="./units"
      />
    </div>
  );
};

export default MyOrganizationHome;
