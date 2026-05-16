import { useContext } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../../contexts/auth/useAuth";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import CourseEnrollmentsInput from "../components/CourseEnrollmentsInput";

const MyOrganizationTraining: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading, isUnitContext } =
    useContext(OrganizationsContext);
  const { isGlobalAdmin } = useAuth();

  if (currentOrganizationLoading || !currentOrganization) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  if (!isGlobalAdmin || isUnitContext) {
    return <Navigate to=".." replace relative="path" />;
  }

  return (
    <div className="rounded-lg bg-white p-6 ring-1 ring-gray-900/5">
      <CourseEnrollmentsInput
        organizationId={currentOrganization.id}
        accessSettings={currentOrganization.trainingAccessSettings}
      />
    </div>
  );
};

export default MyOrganizationTraining;
