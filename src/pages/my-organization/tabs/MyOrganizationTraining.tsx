import { useContext, useMemo } from "react";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import InlineNotice from "../../../components/layouts/InlineNotice";
import {
  ORGANIZATION_TRAINING_ADMIN_GROUP_NAME,
  UNIT_TRAINING_ADMIN_GROUP_NAME,
} from "../../../constants/organizations";
import { useAuth } from "../../../contexts/auth/useAuth";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import { Organization } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import CourseEnrollmentsInput from "../../admin-panel/organizations/components/CourseEnrollmentsInput";
import GroupMembersTable from "../components/GroupMembersTable";

const MyOrganizationTraining: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    isUnitContext,
    currentUnitSlug,
    roleGroups,
    roleGroupsLoading,
  } = useContext(MyOrganizationContext);
  const { isGlobalAdmin } = useAuth();

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

  const enrollmentFormMethods = useForm<DeepPartial<Organization>>({
    values: myOrganization ?? {},
  });

  return (
    <div>
      {myOrganizationLoading || !myOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <FormProvider {...enrollmentFormMethods}>
          <div className="space-y-4">
            {!isUnitContext && (
              <LargeFormSection
                heading="Course Enrollments"
                subheading="Enrollments provide access to training content for given windows of time."
                defaultOpen
              >
                <CourseEnrollmentsInput
                  name="enrollments"
                  organizationId={myOrganization.id}
                  accessSettings={myOrganization.trainingAccessSettings}
                />
              </LargeFormSection>
            )}
            {(!trainingAdminGroupNotFound || isGlobalAdmin) && (
              <LargeFormSection
                heading="Training Admins"
                subheading={`Grant access to manage training for this ${
                  isUnitContext ? "unit" : "organization"
                }.`}
                defaultOpen
              >
                {roleGroupsLoading ? (
                  <div className="animate-pulse rounded bg-slate-200 w-full h-48" />
                ) : (
                  <div className="space-y-4">
                    {trainingAdminGroupNotFound && (
                      <InlineNotice
                        level="warning"
                        heading="Training Admin Role Group Unavailable"
                        body={`No role group exists with name "${trainingAdminGroupName}". Please make sure an appropriate role group exists with this name.`}
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
                        organizationId={myOrganization.id}
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
        </FormProvider>
      )}
    </div>
  );
};

export default MyOrganizationTraining;
