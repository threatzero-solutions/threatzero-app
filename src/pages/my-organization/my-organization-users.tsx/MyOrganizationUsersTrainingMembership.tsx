import { useQuery } from "@tanstack/react-query";
import DataTable from "../../../components/layouts/DataTable";
import { useAuth } from "../../../contexts/AuthProvider";
import {
  getOrganizationBySlug,
  getOrganizationUsers,
} from "../../../queries/organizations";
import Select from "../../../components/forms/inputs/Select";

const MyOrganizationUsersTrainingMembership: React.FC = () => {
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

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["organizations-users", myOrganization?.id] as const,
    queryFn: ({ queryKey }) => getOrganizationUsers(queryKey[1]),
    enabled: !!myOrganization?.id,
  });

  return (
    <>
      <DataTable
        data={{
          headers: [
            {
              label: "Email",
              key: "email",
            },
            {
              label: "First Name",
              key: "firstName",
            },
            {
              label: "Last Name",
              key: "lastName",
            },
            {
              label: "Access Level",
              key: "accessLevel",
            },
          ],
          rows: (users?.results ?? []).map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            accessLevel: (
              <Select
                disabled={!myOrganization?.allowedAudiences?.length}
                options={
                  myOrganization?.allowedAudiences?.map((audience) => ({
                    key: audience,
                    label: audience,
                  })) ?? []
                }
              />
            ),
          })),
        }}
        isLoading={organizationLoading || usersLoading}
        // action={
        //   <button
        //     type="button"
        //     className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
        //     onClick={() => {}}
        //   >
        //     + Add Users
        //   </button>
        // }
      />
    </>
  );
};

export default MyOrganizationUsersTrainingMembership;
