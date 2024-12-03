import { useCallback, useContext, useMemo } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { getOrganizationIdpRoleGroups } from "../../../queries/organizations";
import { useQuery } from "@tanstack/react-query";
import GroupMembersTable from "../components/GroupMembersTable";
import SafetyContactInput from "../../../components/safety-management/SafetyContactInput";
import PolicyProcedureInput from "../../../components/safety-management/PolicyProcedureInput";
import { SafetyContact } from "../../../types/entities";

const MyOrganizationSafety: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    saveOrganization,
    currentUnitSlug,
    currentUnit,
    saveCurrentUnit,
    isUnitContext,
  } = useContext(MyOrganizationContext);

  const { data: allRoleGroups } = useQuery({
    queryKey: ["roleGroups", myOrganization?.id] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] ? getOrganizationIdpRoleGroups(queryKey[1]) : null,
    enabled: !!myOrganization?.id,
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

  const handleSaveSafetyContact = useCallback(
    (safetyContact: Partial<SafetyContact> | undefined | null) => {
      if (isUnitContext) {
        if (currentUnit?.id) {
          saveCurrentUnit({
            id: currentUnit.id,
            safetyContact,
          });
        }
      } else {
        if (myOrganization?.id) {
          saveOrganization({
            id: myOrganization.id,
            safetyContact,
          });
        }
      }
    },
    [
      isUnitContext,
      currentUnit?.id,
      myOrganization?.id,
      saveCurrentUnit,
      saveOrganization,
    ]
  );

  return (
    <div>
      {myOrganizationLoading || !myOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          <LargeFormSection
            heading="Threat Assessment Team Members"
            subheading="Sort and filter through organization TAT members."
            defaultOpen
          >
            <div className="space-y-2">
              {tatGroupId && (
                <GroupMembersTable
                  organizationId={myOrganization.id}
                  unitSlug={currentUnitSlug}
                  joinText="Add TAT Member"
                  leaveText="Leave TAT"
                  groupId={tatGroupId}
                />
              )}
            </div>
          </LargeFormSection>
          <LargeFormSection
            heading="Safety Contact"
            subheading="This is the primary safety contact displayed to users."
            defaultOpen
          >
            <SafetyContactInput
              value={
                isUnitContext
                  ? currentUnit?.safetyContact
                  : myOrganization.safetyContact
              }
              onChange={(e) => handleSaveSafetyContact(e.target?.value)}
            />
          </LargeFormSection>
          <LargeFormSection
            heading="Policies & Procedures"
            subheading="Documents accessible to users that outline polices and procedures."
            defaultOpen
          >
            <PolicyProcedureInput
              value={
                isUnitContext
                  ? currentUnit?.policiesAndProcedures
                  : myOrganization.policiesAndProcedures
              }
              // onChange={(e) => field.onChange(e.target?.value)}
            />
          </LargeFormSection>
        </div>
      )}
    </div>
  );
};

export default MyOrganizationSafety;
