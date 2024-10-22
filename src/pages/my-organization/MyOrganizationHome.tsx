import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthProvider";
import { getOrganizationBySlug } from "../../queries/organizations";

const MyOrganizationHome = () => {
  const { keycloak } = useAuth();

  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: ["organizations", keycloak!.tokenParsed!.organization] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[1]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  return (
    <div>
      {organizationLoading || !myOrganization ? (
        <div className="animate-pulse rounded bg-slate-200 w-full h-6" />
      ) : (
        <>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            {myOrganization.name}
          </h1>
          <p className="text-sm">{myOrganization.address}</p>
        </>
      )}
    </div>
  );
};

export default MyOrganizationHome;
