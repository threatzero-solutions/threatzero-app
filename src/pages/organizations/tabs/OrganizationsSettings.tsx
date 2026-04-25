import { TrashIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import FormField from "../../../components/forms/FormField";
import MultipleSelect from "../../../components/forms/inputs/MultipleSelect";
import Toggle from "../../../components/forms/inputs/Toggle";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import IconButton from "../../../components/layouts/buttons/IconButton";
import InlineNotice from "../../../components/layouts/InlineNotice";
import { DISABLED_ROLE_GROUPS } from "../../../constants/organizations";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { useMe } from "../../../contexts/me/MeProvider";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  deleteOrganization,
  deleteUnit,
  getRoleGroupsForOrganization,
  saveOrganization,
} from "../../../queries/organizations";
import { classNames } from "../../../utils/core";

const MyOrganizationSettings: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    invalidateOrganizationQuery,
    invalidateAllUnitsQuery,
    currentUnit,
    isUnitContext,
    allUnits,
    navigateAfterDelete,
  } = useContext(OrganizationsContext);
  const { isGlobalAdmin } = useAuth();
  const { me } = useMe();
  const {
    setOpen: setConfirmationOpen,
    setClose: setConfirmationClose,
    setConfirmationOptions,
  } = useContext(ConfirmationContext);

  const { data: allRoleGroups } = useQuery({
    queryKey: [
      "organization-role-groups",
      currentOrganization?.id ?? "",
    ] as const,
    queryFn: ({ queryKey }) => getRoleGroupsForOrganization(queryKey[1]),
    enabled: !!currentOrganization,
  });

  const { mutate: doSaveOrganization, isPending: isOrganizationSaving } =
    useMutation({
      mutationFn: saveOrganization,
      onSuccess: () => {
        invalidateOrganizationQuery();
      },
    });

  const { mutate: doDeleteOrganization, isPending: isOrganizationDeleting } =
    useMutation({
      mutationFn: deleteOrganization,
      onSuccess: () => {
        setConfirmationClose();
        navigateAfterDelete();
      },
    });

  const { mutate: doDeleteCurrentUnit, isPending: isUnitDeleting } =
    useMutation({
      mutationFn: deleteUnit,
      onSuccess: () => {
        invalidateAllUnitsQuery();
        setConfirmationClose();
        navigateAfterDelete();
      },
    });

  // Disable delete when the user is deleting their own home org/unit. Home is
  // sourced from `/me.residence` (see `_docs/authorization-model.md §4`). A
  // null residence — e.g. system admins, unenrolled users — yields no disable,
  // preserving the prior "fall through on missing data" semantics.
  const deleteDisabled = useMemo(() => {
    const residence = me?.residence;
    if (!residence) return false;

    if (isUnitContext) {
      const residenceUnitId = residence.unitId;
      if (!residenceUnitId || !currentUnit?.id) return false;

      // Walk up from the residence unit: if the current unit matches the
      // residence unit or any of its ancestors, deletion would orphan the
      // user's home. Block it.
      const unitsById = new Map((allUnits ?? []).map((u) => [u.id, u]));
      const visited = new Set<string>();
      let cursor: string | null = residenceUnitId;
      while (cursor && !visited.has(cursor)) {
        visited.add(cursor);
        if (cursor === currentUnit.id) return true;
        cursor = unitsById.get(cursor)?.parentUnitId ?? null;
      }
      return false;
    }

    return (
      !!currentOrganization?.id &&
      residence.organizationId === currentOrganization.id
    );
  }, [isUnitContext, me, currentOrganization, currentUnit, allUnits]);

  const deleteTitle = useMemo(
    () =>
      `Delete ${
        isUnitContext
          ? (currentUnit?.name ?? "Unit")
          : (currentOrganization?.name ?? "Organization")
      }`,
    [isUnitContext, currentUnit, currentOrganization],
  );

  useEffect(() => {
    setConfirmationOptions((draft) => {
      draft.isPending = isUnitDeleting || isOrganizationDeleting;
    });
  }, [isUnitDeleting, isOrganizationDeleting, setConfirmationOptions]);

  const handleDelete = () => {
    setConfirmationOpen({
      title: deleteTitle + "?",
      message: `Are you sure you want to delete this ${
        isUnitContext ? "unit" : "organization"
      }? This action cannot be undone.`,
      onConfirm: () => {
        if (isUnitContext) {
          doDeleteCurrentUnit(currentUnit?.id);
        } else {
          doDeleteOrganization(currentOrganization?.id);
        }
      },
      destructive: true,
      confirmText: "Delete",
      requireTextInput: true,
      textInputPrompt: `Type ${
        isUnitContext ? "unit" : "organization"
      } name to confirm:`,
      textInputPlaceholder: isUnitContext
        ? currentUnit?.name
        : currentOrganization?.name,
      validateTextInput: (text) =>
        text ===
        (isUnitContext ? currentUnit?.name : currentOrganization?.name),
    });
  };

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          {isGlobalAdmin && !isUnitContext && (
            <LargeFormSection heading="Administration" defaultOpen>
              <FormField
                field={{
                  label: "Allowed Role Groups",
                  helpText:
                    "Select role groups that this organization's administrators are allowed to grant to their own users.",
                }}
                input={
                  <MultipleSelect
                    prefix="allowed-role-groups"
                    options={(allRoleGroups ?? []).map((rg) => ({
                      key: rg.id,
                      label: rg.name,
                      disabled: DISABLED_ROLE_GROUPS.includes(rg.name),
                    }))}
                    value={currentOrganization.allowedRoleGroups ?? []}
                    onChange={(allowedRoleGroups) =>
                      doSaveOrganization({
                        id: currentOrganization.id,
                        allowedRoleGroups,
                      })
                    }
                  />
                }
              />
            </LargeFormSection>
          )}
          {!isUnitContext && (
            <LargeFormSection heading="Notifications" defaultOpen>
              <div className="space-y-4">
                <FormField
                  field={{
                    label: "Enable Initial Training Reminder Emails",
                    helpText:
                      "Enable or disable initial training reminder emails for this organization. These emails are sent to all participants at the beginning of the training availability period.",
                  }}
                  input={
                    <Toggle
                      prefix="initial-training-reminder-emails"
                      loading={isOrganizationSaving}
                      disabled={isOrganizationSaving}
                      checked={
                        currentOrganization.notificationSettings
                          ?.initialReminderEmailsEnabled ?? false
                      }
                      onChange={(initialReminderEmailsEnabled) =>
                        doSaveOrganization({
                          id: currentOrganization.id,
                          notificationSettings: {
                            ...(currentOrganization.notificationSettings ?? {}),
                            initialReminderEmailsEnabled,
                          },
                        })
                      }
                    />
                  }
                />
                <FormField
                  field={{
                    label: "Enable Follow-Up Training Reminder Emails",
                    helpText:
                      "Enable or disable follow-up training reminder emails for this organization. These emails are sent up to two weeks after the initial training reminder email for all participants who have not completed the training.",
                  }}
                  input={
                    <Toggle
                      prefix="follow-up-training-reminder-emails"
                      loading={isOrganizationSaving}
                      disabled={isOrganizationSaving}
                      checked={
                        currentOrganization.notificationSettings
                          ?.followUpReminderEmailsEnabled ?? false
                      }
                      onChange={(followUpReminderEmailsEnabled) =>
                        doSaveOrganization({
                          id: currentOrganization.id,
                          notificationSettings: {
                            ...(currentOrganization.notificationSettings ?? {}),
                            followUpReminderEmailsEnabled,
                          },
                        })
                      }
                    />
                  }
                />
              </div>
            </LargeFormSection>
          )}

          <LargeFormSection
            heading="Advanced"
            // subheading="This is the primary safety contact displayed to users."
            defaultOpen
          >
            <InlineNotice
              heading={"Danger Zone"}
              body={
                <div className="space-y-4">
                  <p>
                    Actions in this section are permanent and cannot be undone.
                  </p>
                  <IconButton
                    type="button"
                    icon={TrashIcon}
                    className={classNames(
                      "block rounded-md bg-red-600 px-3 py-2 ring-transparent text-center text-sm font-semibold text-white shadow-xs enabled:hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50",
                    )}
                    text={`Delete ${
                      isUnitContext
                        ? (currentUnit?.name ?? "Unit")
                        : (currentOrganization.name ?? "Organization")
                    }`}
                    onClick={() => handleDelete()}
                    disabled={deleteDisabled}
                    title={
                      deleteDisabled
                        ? `Cannot delete ${
                            isUnitContext ? "unit" : "organization"
                          } that you belong to.`
                        : ""
                    }
                  />
                </div>
              }
              level="error"
            />
          </LargeFormSection>
        </div>
      )}
    </div>
  );
};

export default MyOrganizationSettings;
