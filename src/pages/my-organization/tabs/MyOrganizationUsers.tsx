import { useContext } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import AllUsersTable from "../components/AllUsersTable";
import OrganizationIdpsInput from "../../admin-panel/organizations/components/OrganizationIdpsInput";

const MyOrganizationUsers: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    currentUnitSlug,
    isUnitContext,
  } = useContext(MyOrganizationContext);

  return (
    <div>
      {myOrganizationLoading || !myOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          <LargeFormSection
            heading="All Users"
            subheading="Sort and filter through users in organization."
            defaultOpen
          >
            <div className="space-y-2">
              <AllUsersTable
                organizationId={myOrganization.id}
                unitSlug={currentUnitSlug}
              />
            </div>
          </LargeFormSection>
          {!isUnitContext && (
            <LargeFormSection
              heading="Identity Providers"
              subheading="Automatically link user data from external management systems."
              defaultOpen
            >
              <div className="6">
                {myOrganization && (
                  <OrganizationIdpsInput
                    organization={myOrganization}
                    idpSlugs={myOrganization.idpSlugs}
                  />
                )}
              </div>
            </LargeFormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrganizationUsers;
