import { useContext } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import OrganizationIdpsInput from "../../admin-panel/organizations/components/OrganizationIdpsInput";
import AllUsersTable from "../components/AllUsersTable";

const MyOrganizationUsers: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    currentUnitSlug,
    isUnitContext,
    organizationIdps,
    organizationIdpsLoading,
  } = useContext(OrganizationsContext);

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
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
                organizationId={currentOrganization.id}
                unitSlug={currentUnitSlug}
              />
            </div>
          </LargeFormSection>
          {!isUnitContext && (
            <LargeFormSection
              heading="SSO (Identity Providers)"
              subheading="Automatically link user data from external management systems."
              defaultOpen
            >
              <div className="6">
                {organizationIdps && !organizationIdpsLoading ? (
                  <OrganizationIdpsInput
                    organization={currentOrganization}
                    idpSlugs={currentOrganization.idpSlugs ?? []}
                    idps={organizationIdps}
                  />
                ) : (
                  <>
                    <div className="animate-pulse rounded bg-slate-200 w-full h-32" />
                    <div className="animate-pulse rounded bg-slate-200 w-full h-32" />
                    <div className="animate-pulse rounded bg-slate-200 w-full h-32" />
                  </>
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
