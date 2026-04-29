import { useContext } from "react";
import { Navigate } from "react-router";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { useAuth } from "../../../contexts/auth/useAuth";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import CourseEnrollmentsInput from "../components/CourseEnrollmentsInput";

const MyOrganizationTraining: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading, isUnitContext } =
    useContext(OrganizationsContext);
  const { isGlobalAdmin } = useAuth();

  if (currentOrganizationLoading || !currentOrganization) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
        <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
      </div>
    );
  }

  if (!isGlobalAdmin || isUnitContext) {
    return <Navigate to=".." replace relative="path" />;
  }

  return (
    <div className="space-y-4">
      <LargeFormSection
        heading="Course Enrollments"
        subheading="Enrollments provide access to training content for given windows of time."
        defaultOpen
      >
        <CourseEnrollmentsInput
          organizationId={currentOrganization.id}
          accessSettings={currentOrganization.trainingAccessSettings}
        />
      </LargeFormSection>
    </div>
  );
};

export default MyOrganizationTraining;
