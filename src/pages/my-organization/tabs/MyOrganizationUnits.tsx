import { useContext, useMemo } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import SubunitsTable from "../components/SubunitsTable";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import SOSLocationsTable from "../components/SOSLocationsTable";
import GroupMembersTable from "../components/GroupMembersTable";
import { useAuth } from "../../../contexts/auth/useAuth";
import InlineNotice from "../../../components/layouts/InlineNotice";
import { classNames } from "../../../utils/core";

const UNIT_ADMIN_GROUP_NAME = "Unit Admin";
const ORGANIZATION_ADMIN_GROUP_NAME = "Organization Admin";

const MyOrganizationUnits: React.FC = () => {
  const {
    allUnits,
    allUnitsLoading,
    myOrganization,
    myOrganizationLoading,
    currentUnitSlug,
    setUnitsPath,
    isUnitContext,
    roleGroups,
    roleGroupsLoading,
  } = useContext(MyOrganizationContext);
  const { isGlobalAdmin } = useAuth();

  const organizationAdminGroupName = useMemo(
    () =>
      isUnitContext ? UNIT_ADMIN_GROUP_NAME : ORGANIZATION_ADMIN_GROUP_NAME,
    [isUnitContext]
  );

  const organizationAdminGroupId = useMemo(
    () => roleGroups?.find((g) => g.name === organizationAdminGroupName)?.id,
    [roleGroups, organizationAdminGroupName]
  );

  const organizationAdminGroupNotFound = useMemo(
    () => !roleGroupsLoading && !organizationAdminGroupId,
    [roleGroupsLoading, organizationAdminGroupId]
  );

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
            organizationId={myOrganization.id}
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
          {(!organizationAdminGroupNotFound || isGlobalAdmin) && (
            <LargeFormSection
              heading={isUnitContext ? "Unit Admins" : "Organization Admins"}
              subheading={`Grant access to manage this ${
                isUnitContext ? "unit and subunits" : "organization and units"
              }.`}
              defaultOpen
            >
              {roleGroupsLoading ? (
                <div className="animate-pulse rounded bg-slate-200 w-full h-48" />
              ) : (
                <div className="space-y-4">
                  {organizationAdminGroupNotFound && (
                    <InlineNotice
                      level="warning"
                      heading={`${
                        isUnitContext ? "Unit" : "Organization"
                      } Admin Role Group Unavailable`}
                      body={`No role group exists with name "${organizationAdminGroupName}". Please make sure an appropriate role group exists with this name.`}
                    />
                  )}
                  <div
                    className={classNames(
                      organizationAdminGroupNotFound
                        ? "grayscale pointer-events-none opacity-60"
                        : ""
                    )}
                  >
                    <GroupMembersTable
                      organizationId={myOrganization.id}
                      unitSlug={currentUnitSlug}
                      joinText={
                        isUnitContext
                          ? "Add Unit Admin"
                          : "Add Organization Admin"
                      }
                      leaveText="Revoke Access"
                      groupId={""}
                    />
                  </div>
                </div>
              )}
            </LargeFormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrganizationUnits;
