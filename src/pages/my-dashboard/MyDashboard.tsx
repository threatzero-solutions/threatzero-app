import { useContext } from "react";
import { TrainingContext } from "../../contexts/training/training-context";
import FeaturedSection from "../training-library/components/FeaturedSection";
import { useAuth } from "../../contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationBySlug,
  getUnitBySlug,
} from "../../queries/organizations";
import { stripPhoneNumber } from "../../utils/core";

const MyDashboard: React.FC = () => {
  const { state } = useContext(TrainingContext);

  const { keycloak } = useAuth();

  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: ["organizations", keycloak!.tokenParsed!.organization] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[1]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  const { data: myUnit, isLoading: unitLoading } = useQuery({
    queryKey: ["units", keycloak!.tokenParsed!.unit] as const,
    queryFn: ({ queryKey }) => getUnitBySlug(queryKey[1]),
    enabled: !!keycloak?.tokenParsed?.unit,
  });

  const orgsLoading = organizationLoading || unitLoading;

  const mySafetyContact =
    myUnit?.safetyContact ?? myOrganization?.safetyContact;

  const myPoliciesAndProcedures = [
    ...(myUnit?.policiesAndProcedures ?? []),
    ...(myOrganization?.policiesAndProcedures ?? []),
  ];

  return (
    <div className={"space-y-12"}>
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold leading-6 text-gray-900">
          My Dashboard
        </h3>
        {keycloak?.tokenParsed?.given_name && (
          <h4 className="text-lg font-medium leading-6 text-primary-500">
            Welcome, {keycloak?.tokenParsed?.given_name}
          </h4>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Safety Contact */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            Safety Contact
          </h3>
          <p className="mt-1 text-gray-500 flex flex-col">
            {orgsLoading ? (
              new Array(3)
                .fill(0)
                .map((_, i) => (
                  <span
                    key={i}
                    className="animate-pulse rounded-lg bg-slate-200 h-6 shadow w-full mb-1"
                  />
                ))
            ) : mySafetyContact ? (
              <>
                <span className="text-lg">
                  {mySafetyContact.name}
                  {mySafetyContact.title ? ` - ${mySafetyContact.title}` : ""}
                </span>
                <a
                  href={`mailto:${mySafetyContact.email}`}
                  className="text-secondary-600 hover:text-secondary-500 transition-colors"
                >
                  {mySafetyContact.email}
                </a>
                <a
                  href={`tel:${stripPhoneNumber(mySafetyContact.phone)}`}
                  className="text-secondary-600 hover:text-secondary-500 transition-colors"
                >
                  {mySafetyContact.phone}
                </a>
              </>
            ) : (
              "Safety contact not found."
            )}
          </p>
        </div>
        {/* Policies & Procedures */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            Policies & Procedures
          </h3>
          <p className="mt-1 text-gray-500 flex flex-col">
            {orgsLoading
              ? new Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <span
                      key={i}
                      className="animate-pulse rounded-lg bg-slate-200 h-6 shadow w-full mb-2"
                    />
                  ))
              : myPoliciesAndProcedures.length
              ? myPoliciesAndProcedures.map((organizationPolicyFile) => (
                  <a
                    key={organizationPolicyFile.id}
                    href={organizationPolicyFile.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-secondary-600 hover:text-secondary-500 transition-colors"
                  >
                    {organizationPolicyFile.name} (.pdf) &rarr;
                  </a>
                ))
              : "Your organization currently has posted no policies or procedures."}
          </p>
        </div>
      </div>
      <FeaturedSection
        loading={state.activeCourse === undefined}
        sections={state.activeCourse?.sections}
        title="Featured Training"
        showAllTrainingLink
      />
    </div>
  );
};

export default MyDashboard;
