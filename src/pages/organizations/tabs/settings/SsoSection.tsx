import { useContext } from "react";
import { OrganizationsContext } from "../../../../contexts/organizations/organizations-context";
import OrganizationIdpsInput from "../../components/OrganizationIdpsInput";
import { OrgScopeNotice } from "../../components/OrgScopeNotice";

export const SsoSection: React.FC = () => {
  const {
    currentOrganization,
    organizationIdps,
    organizationIdpsLoading,
    isUnitContext,
  } = useContext(OrganizationsContext);

  if (isUnitContext) {
    return (
      <OrgScopeNotice
        description={({ orgName, unitName }) => (
          <>
            Single sign-on is linked at the {orgName} level and inherited by
            every unit. {unitName} uses whatever identity providers {orgName}{" "}
            has connected.
          </>
        )}
      />
    );
  }

  if (!currentOrganization || organizationIdpsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-24" />
        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="max-w-[62ch]">
        <h2 className="text-base font-semibold text-gray-900">
          Single sign-on
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Connect identity providers so users can sign in with your
          organization's accounts. Claim-match rules on the Access rules tab run
          off the tokens these providers return.
        </p>
      </div>

      <OrganizationIdpsInput
        organization={currentOrganization}
        idpSlugs={currentOrganization.idpSlugs ?? []}
        idps={organizationIdps ?? []}
      />
    </div>
  );
};
