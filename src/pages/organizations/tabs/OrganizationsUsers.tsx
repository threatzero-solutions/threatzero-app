import { useContext } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import AllUsersTable from "../components/AllUsersTable";
import OrganizationIdpsInput from "../components/OrganizationIdpsInput";

const MyOrganizationUsers: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    currentUnitSlug,
    isUnitContext,
    organizationIdps,
    organizationIdpsLoading,
  } = useContext(OrganizationsContext);

  const { hasPermissions } = useAuth();

  return (
    <>
      <div>
        {currentOrganizationLoading || !currentOrganization ? (
          <div className="space-y-4">
            <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
            <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
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
            {!isUnitContext &&
              hasPermissions(
                [WRITE.ORGANIZATIONS, WRITE.ORGANIZATION_IDPS],
                "all"
              ) && (
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
                        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-32" />
                        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-32" />
                        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-32" />
                      </>
                    )}
                  </div>
                </LargeFormSection>
              )}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrganizationUsers;
