import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/auth/useAuth";
import {
  getOrganizationBySlug,
  getOrganizationUsers,
  getUnits,
} from "../../../queries/organizations";
import { createColumnHelper } from "@tanstack/react-table";
import { OrganizationUser } from "../../../types/api";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";
import { humanizeSlug } from "../../../utils/core";
import { useMemo } from "react";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

const columnHelper = createColumnHelper<OrganizationUser>();

const MyOrganizationUsersAll: React.FC = () => {
  const { keycloak, hasMultipleUnitAccess } = useAuth();

  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: [
      "organization",
      "slug",
      keycloak!.tokenParsed!.organization,
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[2]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  const [usersQuery, setUsersQuery] = useImmer<ItemFilterQueryParams>({
    order: { createdTimestamp: "DESC" },
  });
  const [debouncedUsersQuery] = useDebounceValue(usersQuery, 500);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: [
      "organizations-users",
      myOrganization?.id,
      debouncedUsersQuery,
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationUsers(queryKey[1], queryKey[2]),
    enabled: !!myOrganization?.id,
  });

  const { data: units } = useQuery({
    queryKey: ["units", { ["organization.id"]: myOrganization?.id }] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
    enabled: !!myOrganization?.id,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor((t) => t.email, {
        id: "email",
        header: "Email",
      }),
      columnHelper.accessor((t) => t.firstName, {
        id: "firstName",
        header: "First Name",
      }),
      columnHelper.accessor((t) => t.lastName, {
        id: "lastName",
        header: "Last Name",
      }),
      columnHelper.accessor((t) => t.attributes.unit, {
        id: "unit",
        header: "Unit",
        cell: (info) => (
          <span>
            {info
              .getValue()
              ?.map((u) => units?.results?.find((unit) => unit.slug === u))
              .filter(Boolean)
              .find((u) => u)?.name ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor((t) => t.attributes.audience, {
        id: "audience",
        header: "Training Groups",
        cell: (info) => (
          <span>
            {info
              .getValue()
              ?.map((a) => humanizeSlug(a))
              ?.join(", ") ?? "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: () => (
          <ButtonGroup>
            <IconButton
              className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
              icon={ArrowRightIcon}
              trailing
              text="View"
            />
          </ButtonGroup>
        ),
        enableSorting: false,
      }),
    ],
    [units?.results]
  );

  return (
    <>
      <DataTable2
        columns={columns}
        columnVisibility={{
          unit: hasMultipleUnitAccess,
        }}
        data={users?.results ?? []}
        isLoading={organizationLoading || usersLoading}
        query={usersQuery}
        setQuery={setUsersQuery}
        pageState={users}
        showFooter={false}
        noRowsMessage="No users found."
        searchOptions={{
          placeholder: "Search by name or email...",
        }}
      />
    </>
  );
};

export default MyOrganizationUsersAll;
