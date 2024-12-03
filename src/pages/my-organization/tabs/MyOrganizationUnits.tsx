import { useContext } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import SubunitsTable from "../components/SubunitsTable";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import SOSLocationsTable from "../components/SOSLocationsTable";
import GroupMembersTable from "../components/GroupMembersTable";

const MyOrganizationUnits: React.FC = () => {
  const {
    allUnits,
    allUnitsLoading,
    myOrganization,
    myOrganizationLoading,
    currentUnitSlug,
    setUnitsPath,
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
          <SubunitsTable
            units={allUnits}
            unitsLoading={allUnitsLoading}
            unitId={currentUnitSlug}
            unitIdType="slug"
            setUnitsPath={setUnitsPath}
            unitsLabelSingular={isUnitContext ? "Subunit" : "Unit"}
            unitsLabelPlural={isUnitContext ? "Subunits" : "Units"}
            render={(children) => (
              <LargeFormSection
                heading={isUnitContext ? "Subunits" : "Units"}
                subheading="View all organizational units."
                defaultOpen
              >
                {children}
              </LargeFormSection>
            )}
          />
          {isUnitContext && currentUnitSlug && (
            <LargeFormSection
              heading="SOS Locations"
              subheading="Provide physical locations for safety concern (SOS) posters and other reporting tools."
              defaultOpen
            >
              <SOSLocationsTable unitId={currentUnitSlug} unitIdType="slug" />
            </LargeFormSection>
          )}
          <LargeFormSection
            heading={isUnitContext ? "Unit Admins" : "Organization Admins"}
            subheading={`Grant access to manage this ${
              isUnitContext ? "unit and subunits" : "organization and units"
            }.`}
            defaultOpen
          >
            <div className="space-y-2">
              <GroupMembersTable
                organizationId={myOrganization.id}
                unitSlug={currentUnitSlug}
                joinText={
                  isUnitContext ? "Add Unit Admin" : "Add Organization Admin"
                }
                leaveText="Revoke Access"
                groupId={""}
              />
            </div>
          </LargeFormSection>
        </div>
      )}
    </div>
  );
};

export default MyOrganizationUnits;
