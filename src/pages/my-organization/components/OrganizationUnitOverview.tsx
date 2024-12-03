import { useQuery } from "@tanstack/react-query";
import {
  getOrganization,
  getOrganizationBySlug,
  getOrganizationIdpRoleGroups,
  getUnits,
} from "../../../queries/organizations";
import { useImmer } from "use-immer";
import { useCallback, useEffect, useMemo } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import AllUsersTable from "./AllUsersTable";
import GroupMembersTable from "./GroupMembersTable";
import Select from "../../../components/forms/inputs/Select";
import FormField from "../../../components/forms/FormField";
import SubunitsTable from "./SubunitsTable";
import SOSLocationsTable from "./SOSLocationsTable";
import { classNames } from "../../../utils/core";

interface OrganizationUnitOverviewProps {
  organizationId: string | null;
  organizationIdType?: "id" | "slug";
  unitId?: string;
  unitIdType?: "id" | "slug";
  unitsRoot: string;
}

const OrganizationUnitOverview: React.FC<OrganizationUnitOverviewProps> = ({
  organizationId,
  organizationIdType = "id",
  unitId,
  unitIdType = "id",
  unitsRoot,
}) => {
  const { data: organization, isLoading: organizationLoading } = useQuery({
    queryKey: ["organization", organizationIdType, organizationId!] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] === "id"
        ? getOrganization(queryKey[2])
        : getOrganizationBySlug(queryKey[2]),
    enabled: !!organizationId,
  });

  const { data: allRoleGroups } = useQuery({
    queryKey: ["roleGroups", organization?.id] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] ? getOrganizationIdpRoleGroups(queryKey[1]) : null,
    enabled: !!organization?.id,
  });

  const findGroup = useCallback(
    (q: string) => {
      const qParts = q.toLowerCase().split(" ");

      return allRoleGroups?.find((roleGroup) =>
        qParts.every((p) => roleGroup.name.toLowerCase().split(" ").includes(p))
      );
    },
    [allRoleGroups]
  );

  const tatGroupId = useMemo(
    () => findGroup("organization tat")?.id,
    [findGroup]
  );

  const { data: thisUnit, isLoading: thisUnitLoading } = useQuery({
    queryKey: [
      "unit",
      unitIdType,
      {
        [`organization.${organizationIdType}`]: organizationId,
        [unitIdType]: unitId,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[2]).then((units) => units.results.find((u) => u)),
    enabled: !!organizationId && !!unitId,
  });

  const accessManagementGroups = useMemo(
    () =>
      allRoleGroups?.filter(
        (g) =>
          g.attributes?.type?.includes("access") &&
          g.attributes?.level?.includes(thisUnit ? "unit" : "organization")
      ),
    [allRoleGroups, thisUnit]
  );

  const [selectedAccessMgtmGroupId, setSelectedAccessMgtmGroupId] = useImmer<
    string | null
  >(null);

  useEffect(() => {
    if (accessManagementGroups?.length) {
      setSelectedAccessMgtmGroupId(accessManagementGroups[0].id);
    }
  }, [accessManagementGroups, setSelectedAccessMgtmGroupId]);

  return (
    <div>
      {organizationLoading || !organization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded bg-slate-200 w-full h-24" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={classNames(
              "mb-2 rounded-md text-white font-semibold text-xs py-2 px-3 bg-gradient-to-r",
              unitId
                ? "from-secondary-600 to-secondary-500"
                : "from-primary-600 to-primary-500"
            )}
          >
            {unitId ? "Unit" : "Organization"}
          </div>
          <div>
            {(unitId && thisUnitLoading) || organizationLoading ? (
              <div className="animate-pulse rounded bg-slate-200 w-full h-12" />
            ) : (
              <>
                <h1 className="text-2xl font-semibold leading-6 text-gray-900">
                  {thisUnit?.name ?? organization.name}
                </h1>
                <p className="text-sm py-2">
                  {thisUnit?.address ?? organization.address}
                </p>
              </>
            )}
          </div>
          <SubunitsTable
            organizationId={organizationId}
            organizationIdType={organizationIdType}
            unitId={unitId}
            unitIdType={unitIdType}
            unitsRoot={unitsRoot}
            unitsLabelSingular={unitId ? "Subunit" : "Unit"}
            unitsLabelPlural={unitId ? "Subunits" : "Units"}
            render={(children) => (
              <LargeFormSection
                heading={unitId ? "Subunits" : "Units"}
                subheading="View all organizational units."
                defaultOpen
              >
                {children}
              </LargeFormSection>
            )}
          />
          {unitId && (
            <LargeFormSection
              heading="SOS Locations"
              subheading="Sort and filter through users in organization."
              defaultOpen
            >
              <SOSLocationsTable unitId={unitId} unitIdType={unitIdType} />
            </LargeFormSection>
          )}
          <LargeFormSection
            heading="All Users"
            subheading="Sort and filter through users in organization."
            defaultOpen
          >
            <div className="space-y-2">
              <AllUsersTable
                organizationId={organization.id}
                unitSlug={thisUnit?.slug}
              />
            </div>
          </LargeFormSection>
          <LargeFormSection
            heading="Threat Assessment Team Members"
            subheading="Sort and filter through organization TAT members."
            defaultOpen
          >
            <div className="space-y-2">
              {tatGroupId && (
                <GroupMembersTable
                  organizationId={organization.id}
                  unitSlug={thisUnit?.slug}
                  joinText="Add TAT Member"
                  leaveText="Leave TAT"
                  groupId={tatGroupId}
                />
              )}
            </div>
          </LargeFormSection>
          {accessManagementGroups && accessManagementGroups.length > 0 && (
            <LargeFormSection
              heading="Access Management"
              subheading="Manage access to your organization."
              defaultOpen
            >
              <div className="space-y-6">
                <FormField
                  field={{
                    label: "Select an access type:",
                    name: "selectedAccessMgtmGroupId",
                  }}
                  input={
                    <Select
                      value={selectedAccessMgtmGroupId ?? ""}
                      onChange={(e) =>
                        setSelectedAccessMgtmGroupId(e.target.value)
                      }
                      options={accessManagementGroups.map((g) => ({
                        label: g.name,
                        key: g.id,
                      }))}
                    />
                  }
                />
                {selectedAccessMgtmGroupId && (
                  <GroupMembersTable
                    organizationId={organization.id}
                    unitSlug={thisUnit?.slug}
                    joinText="Grant to User"
                    leaveText="Revoke"
                    groupId={selectedAccessMgtmGroupId}
                  />
                )}
              </div>
            </LargeFormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationUnitOverview;
