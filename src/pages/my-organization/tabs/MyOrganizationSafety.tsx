import { useCallback, useContext, useMemo } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import GroupMembersTable from "../components/GroupMembersTable";
import SafetyContactInput from "../../../components/safety-management/SafetyContactInput";
import PolicyProcedureInput from "../../../components/safety-management/PolicyProcedureInput";
import { SafetyContact } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import InlineNotice from "../../../components/layouts/InlineNotice";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useMutation } from "@tanstack/react-query";
import { saveOrganization, saveUnit } from "../../../queries/organizations";

const ORGANIZATION_TAT_GROUP_NAME = "Organization TAT Member";
const UNIT_TAT_GROUP_NAME = "Unit TAT Member";

const MyOrganizationSafety: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    invalidateOrganizationQuery,
    currentUnitSlug,
    currentUnit,
    invalidateCurrentUnitQuery,
    isUnitContext,
    roleGroups,
    roleGroupsLoading,
  } = useContext(MyOrganizationContext);
  const { isGlobalAdmin } = useAuth();

  const tatGroupName = useMemo(
    () => (isUnitContext ? UNIT_TAT_GROUP_NAME : ORGANIZATION_TAT_GROUP_NAME),
    [isUnitContext]
  );

  const tatGroupId = useMemo(
    () => roleGroups?.find((g) => g.name === tatGroupName)?.id,
    [roleGroups, tatGroupName]
  );

  const tatGroupNotFound = useMemo(
    () => !roleGroupsLoading && !tatGroupId,
    [roleGroupsLoading, tatGroupId]
  );

  const { mutate: saveOrganizationMutate } = useMutation({
    mutationFn: saveOrganization,
    onSuccess: () => {
      invalidateOrganizationQuery();
    },
  });

  const { mutate: saveCurrentUnit } = useMutation({
    mutationFn: saveUnit,
    onSuccess: () => {
      invalidateCurrentUnitQuery();
    },
  });

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
          saveOrganizationMutate({
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
      saveOrganizationMutate,
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
          {(!tatGroupNotFound || isGlobalAdmin) && (
            <LargeFormSection
              heading="Threat Assessment Team Members"
              subheading="Sort and filter through organization TAT members."
              defaultOpen
            >
              {roleGroupsLoading ? (
                <div className="animate-pulse rounded bg-slate-200 w-full h-48" />
              ) : (
                <div className="space-y-4">
                  {tatGroupNotFound && (
                    <InlineNotice
                      level="warning"
                      heading="TAT Role Group Unavailable"
                      body={`No role group exists with name "${tatGroupName}". Please make sure an appropriate role group exists with this name.`}
                    />
                  )}
                  <div
                    className={classNames(
                      tatGroupNotFound
                        ? "grayscale pointer-events-none opacity-60"
                        : ""
                    )}
                  >
                    <GroupMembersTable
                      organizationId={myOrganization.id}
                      unitSlug={currentUnitSlug}
                      joinText="Add TAT Member"
                      leaveText="Leave TAT"
                      groupId={tatGroupId ?? ""}
                    />
                  </div>
                </div>
              )}
            </LargeFormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrganizationSafety;
