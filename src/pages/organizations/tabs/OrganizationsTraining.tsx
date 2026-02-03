import { BoltIcon } from "@heroicons/react/20/solid";
import { useContext, useMemo } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import InlineNotice from "../../../components/layouts/InlineNotice";
import {
  ORGANIZATION_TRAINING_ADMIN_GROUP_NAME,
  UNIT_TRAINING_ADMIN_GROUP_NAME,
} from "../../../constants/organizations";
import { READ, WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { classNames } from "../../../utils/core";
import CourseEnrollmentsInput from "../components/CourseEnrollmentsInput";
import GroupMembersTable from "../components/GroupMembersTable";

const MyOrganizationTraining: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    isUnitContext,
    currentUnitSlug,
    roleGroups,
    roleGroupsLoading,
    getIdpRoleGroups,
  } = useContext(OrganizationsContext);
  const { isGlobalAdmin, hasPermissions } = useAuth();

  const trainingAdminGroupName = useMemo(
    () =>
      isUnitContext
        ? UNIT_TRAINING_ADMIN_GROUP_NAME
        : ORGANIZATION_TRAINING_ADMIN_GROUP_NAME,
    [isUnitContext]
  );

  const trainingAdminGroupId = useMemo(
    () => roleGroups?.find((g) => g.name === trainingAdminGroupName)?.id,
    [roleGroups, trainingAdminGroupName]
  );

  const trainingAdminGroupNotFound = useMemo(
    () => !roleGroupsLoading && !trainingAdminGroupId,
    [roleGroupsLoading, trainingAdminGroupId]
  );

  const idpRoleGroups = useMemo(() => getIdpRoleGroups(), [getIdpRoleGroups]);
  const usingSyncedAdminGroup = useMemo(
    () => idpRoleGroups.includes(trainingAdminGroupName),
    [idpRoleGroups, trainingAdminGroupName]
  );

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          {!isUnitContext && (hasPermissions([READ.COURSE_ENROLLMENTS, WRITE.COURSE_ENROLLMENTS], "all") || isGlobalAdmin) && (
            <LargeFormSection
              heading="Course Enrollments"
              subheading="Enrollments provide access to training content for given windows of time."
              defaultOpen
            >
              <CourseEnrollmentsInput
                name="enrollments"
                organizationId={currentOrganization.id}
                accessSettings={currentOrganization.trainingAccessSettings}
              />
            </LargeFormSection>
          )}
          {((!trainingAdminGroupNotFound &&
            hasPermissions([READ.ORGANIZATION_USERS])) ||
            isGlobalAdmin) && (
            <LargeFormSection
              heading="Training Admins"
              subheading={`Grant access to manage training for this ${
                isUnitContext ? "unit" : "organization"
              }.`}
              defaultOpen
            >
              {roleGroupsLoading ? (
                <div className="animate-pulse rounded-sm bg-slate-200 w-full h-48" />
              ) : (
                <div className="space-y-4">
                  {trainingAdminGroupNotFound && (
                    <InlineNotice
                      level="warning"
                      heading="Training Admin Role Group Unavailable"
                      body={`No role group exists with name "${trainingAdminGroupName}". Please make sure an appropriate role group exists with this name.`}
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
                      trainingAdminGroupNotFound
                        ? "grayscale pointer-events-none opacity-60"
                        : ""
                    )}
                  >
                    <GroupMembersTable
                      organizationId={currentOrganization.id}
                      unitSlug={currentUnitSlug}
                      joinText="Add Training Admin"
                      leaveText="Revoke Access"
                      groupId={trainingAdminGroupId ?? ""}
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

export default MyOrganizationTraining;
