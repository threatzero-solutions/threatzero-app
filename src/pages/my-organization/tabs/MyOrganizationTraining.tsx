import { useContext } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import CourseEnrollmentsInput from "../../admin-panel/organizations/components/CourseEnrollmentsInput";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import { Organization } from "../../../types/entities";
import GroupMembersTable from "../components/GroupMembersTable";

const MyOrganizationTraining: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    isUnitContext,
    currentUnitSlug,
  } = useContext(MyOrganizationContext);

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
            <LargeFormSection
              heading="Training Admins"
              subheading={`Grant access to manage training for this ${
                isUnitContext ? "unit" : "organization"
              }.`}
              defaultOpen
            >
              <div className="space-y-2">
                <GroupMembersTable
                  organizationId={myOrganization.id}
                  unitSlug={currentUnitSlug}
                  joinText="Add Training Admin"
                  leaveText="Revoke Access"
                  groupId={""}
                />
              </div>
            </LargeFormSection>
          </div>
        </FormProvider>
      )}
    </div>
  );
};

export default MyOrganizationTraining;
