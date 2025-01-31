import { TrashIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import FormField from "../../../components/forms/FormField";
import MultipleSelect from "../../../components/forms/inputs/MultipleSelect";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import IconButton from "../../../components/layouts/buttons/IconButton";
import InlineNotice from "../../../components/layouts/InlineNotice";
import { DISABLED_ROLE_GROUPS } from "../../../constants/organizations";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  deleteOrganization,
  deleteUnit,
  getRoleGroupsForOrganization,
  saveOrganization,
} from "../../../queries/organizations";
import { classNames, Path } from "../../../utils/core";

const MyOrganizationSettings: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    invalidateOrganizationQuery,
    invalidateAllUnitsQuery,
    currentUnit,
    isUnitContext,
    unitsPath,
    navigateAfterDelete,
  } = useContext(OrganizationsContext);
  const { accessTokenClaims, isGlobalAdmin } = useAuth();
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

  const { mutate: doSaveOrganization } = useMutation({
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

  const deleteDisabled = useMemo(() => {
    if (
      isUnitContext &&
      unitsPath &&
      accessTokenClaims?.organization_unit_path &&
      typeof accessTokenClaims.organization_unit_path === "string"
    ) {
      const userPath = new Path(accessTokenClaims.organization_unit_path);
      const thisPath = new Path(unitsPath);

      // User org unit path should be absolute, meaning it includes the organization in the path.
      // To avoid naming collisions b/w org and unit, behead the user path to remove the org name.
      // Then check if the user path includes the node (or final unit) of the current units path.
      if (userPath.isAbsolute && userPath.behead().includes(thisPath.node)) {
        return true;
      }
    }

    if (
      !isUnitContext &&
      accessTokenClaims?.organization &&
      accessTokenClaims.organization === currentOrganization?.slug
    ) {
      return true;
    }

    return false;
  }, [isUnitContext, accessTokenClaims, currentOrganization, unitsPath]);

  const deleteTitle = useMemo(
    () =>
      `Delete ${
        isUnitContext
          ? currentUnit?.name ?? "Unit"
          : currentOrganization?.name ?? "Organization"
      }`,
    [isUnitContext, currentUnit, currentOrganization]
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
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          {isGlobalAdmin && (
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
                      "block rounded-md bg-red-600 px-3 py-2 ring-transparent text-center text-sm font-semibold text-white shadow-sm enabled:hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                    )}
                    text={`Delete ${
                      isUnitContext
                        ? currentUnit?.name ?? "Unit"
                        : currentOrganization.name ?? "Organization"
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
