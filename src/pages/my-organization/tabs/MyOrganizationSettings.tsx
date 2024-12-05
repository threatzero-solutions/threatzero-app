import { useContext, useMemo } from "react";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useMutation } from "@tanstack/react-query";
import { deleteOrganization, deleteUnit } from "../../../queries/organizations";
import InlineNotice from "../../../components/layouts/InlineNotice";
import { classNames } from "../../../utils/core";
import { TrashIcon } from "@heroicons/react/20/solid";
import IconButton from "../../../components/layouts/buttons/IconButton";
import { CoreContext } from "../../../contexts/core/core-context";
import { useNavigate } from "react-router";

const MyOrganizationSettings: React.FC = () => {
  const {
    myOrganization,
    myOrganizationLoading,
    invalidateAllUnitsQuery,
    currentUnit,
    isUnitContext,
    unitsPath,
    setUnitsPath,
  } = useContext(MyOrganizationContext);
  const { accessTokenClaims } = useAuth();
  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);
  const navigate = useNavigate();

  const { mutate: doDeleteOrganization } = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      navigate("/");
    },
  });

  const { mutate: doDeleteCurrentUnit } = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      const paths = unitsPath?.split("/") ?? [];
      setUnitsPath(paths.length > 1 ? paths.slice(0, -1).join("/") : null);
      invalidateAllUnitsQuery();
    },
  });

  const deleteDisabled = useMemo(() => {
    if (
      isUnitContext &&
      accessTokenClaims?.unit &&
      accessTokenClaims?.unit === currentUnit?.slug
    ) {
      return true;
    }

    if (
      !isUnitContext &&
      accessTokenClaims?.organization &&
      accessTokenClaims?.organization === myOrganization?.slug
    ) {
      return true;
    }

    return false;
  }, [isUnitContext, accessTokenClaims, currentUnit, myOrganization]);

  const deleteTitle = useMemo(
    () =>
      `Delete ${
        isUnitContext
          ? currentUnit?.name ?? "Unit"
          : myOrganization?.name ?? "Organization"
      }`,
    [isUnitContext, currentUnit, myOrganization]
  );

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
          doDeleteOrganization(myOrganization?.id);
        }
        setConfirmationClose();
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

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
                        : myOrganization.name ?? "Organization"
                    }`}
                    onClick={() => handleDelete()}
                    disabled={deleteDisabled}
                    title={
                      deleteDisabled
                        ? `Cannot delete own ${
                            isUnitContext ? "unit" : "organization"
                          }.`
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
