import { BoltIcon } from "@heroicons/react/20/solid";
import { useContext, useMemo } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import InlineNotice from "../../../components/layouts/InlineNotice";
import {
  ORGANIZATION_ADMIN_GROUP_NAME,
  UNIT_ADMIN_GROUP_NAME,
} from "../../../constants/organizations";
import { useAuth } from "../../../contexts/auth/useAuth";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { classNames } from "../../../utils/core";
import GroupMembersTable from "../components/GroupMembersTable";
import SOSLocationsTable from "../components/SOSLocationsTable";
import SubunitsTable from "../components/SubunitsTable";

const MyOrganizationUnits: React.FC = () => {
  const {
    allUnits,
    allUnitsLoading,
    currentOrganization,
    currentOrganizationLoading,
    currentUnitSlug,
    currentUnit,
    setUnitsPath,
    isUnitContext,
    roleGroups,
    roleGroupsLoading,
    getIdpRoleGroups,
    invalidateAllUnitsQuery,
  } = useContext(OrganizationsContext);
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

  const idpRoleGroups = useMemo(() => getIdpRoleGroups(), [getIdpRoleGroups]);
  const usingSyncedAdminGroup = useMemo(
    () => idpRoleGroups.includes(organizationAdminGroupName),
    [idpRoleGroups, organizationAdminGroupName]
  );

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          <SubunitsTable
            organizationId={currentOrganization.id}
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
            onAddSubunitSuccess={() => invalidateAllUnitsQuery()}
          />
          {isUnitContext && currentUnit && (
            <LargeFormSection
              heading="SOS Locations"
              subheading="Provide physical locations for safety concern (SOS) posters and other reporting tools."
              defaultOpen
            >
              <SOSLocationsTable unitId={currentUnit.id} />
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
                  {usingSyncedAdminGroup && (
                    <InlineNotice
                      level="info"
                      heading={
                        <>
                          <BoltIcon className="size-3 inline text-green-500" />{" "}
                          Access is being managed automatically for some users
                          by SSO
                        </>
                      }
                      body="You can still manage access manually here, but changes may be overridden for some users upon next login."
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
                      organizationId={currentOrganization.id}
                      unitSlug={currentUnitSlug}
                      joinText={
                        isUnitContext
                          ? "Add Unit Admin"
                          : "Add Organization Admin"
                      }
                      leaveText="Revoke Access"
                      groupId={organizationAdminGroupId ?? ""}
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
