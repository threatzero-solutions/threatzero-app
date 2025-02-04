import FeaturedSection from "../training-library/components/FeaturedSection";
import { useAuth } from "../../contexts/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationBySlug,
  getUnitBySlug,
} from "../../queries/organizations";
import SafetyContactBody from "../../components/safety-management/SafetyContactBody";

const MyDashboard: React.FC = () => {
  const { keycloak } = useAuth();

  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: [
      "organization",
      "slug",
      keycloak!.tokenParsed!.organization,
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[2]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  const { data: myUnit, isLoading: unitLoading } = useQuery({
    queryKey: ["unit", "slug", keycloak!.tokenParsed!.unit] as const,
    queryFn: ({ queryKey }) => getUnitBySlug(queryKey[2]),
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
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            Safety Contact
          </h3>
          <div className="mt-1 text-gray-500 flex flex-col">
            {orgsLoading ? (
              new Array(3)
                .fill(0)
                .map((_, i) => (
                  <span
                    key={i}
                    className="animate-pulse rounded-lg bg-slate-200 h-6 shadow-sm w-full mb-1"
                  />
                ))
            ) : mySafetyContact ? (
              <SafetyContactBody value={mySafetyContact} />
            ) : (
              "Safety contact not found."
            )}
          </div>
        </div>
        {/* Policies & Procedures */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:p-6">
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
                      className="animate-pulse rounded-lg bg-slate-200 h-6 shadow-sm w-full mb-2"
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
      <FeaturedSection title="Featured Training" showAllTrainingLink />
    </div>
  );
};

export default MyDashboard;
