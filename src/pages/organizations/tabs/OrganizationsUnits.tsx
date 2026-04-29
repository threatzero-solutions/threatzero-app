import { useContext, useMemo } from "react";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { labelsForPreset } from "../../../utils/labels";
import SOSLocationsTable from "../components/SOSLocationsTable";
import SubunitsTable from "../components/SubunitsTable";

const MyOrganizationUnits: React.FC = () => {
  const {
    allUnits,
    allUnitsLoading,
    currentOrganization,
    currentOrganizationLoading,
    currentUnitSlug,
    currentUnit,
    setUnitsPath,
    isUnitContext,
    invalidateAllUnitsQuery,
  } = useContext(OrganizationsContext);

  // Use the *viewed* org's preset, not the signed-in user's. In admin
  // panel, a system admin may be looking at an org whose preset differs
  // from their own.
  const labels = useMemo(
    () => labelsForPreset(currentOrganization?.labelPreset),
    [currentOrganization?.labelPreset],
  );
  // "Subunit" copy is a best-effort fallback — for non-default presets we
  // render e.g. "Sub-schools". Real hierarchy may deserve a dedicated
  // second-level preset later, but that's deferred.
  const subunitSingular = `Sub-${labels.unitSingular.toLowerCase()}`;
  const subunitPlural = `Sub-${labels.unitPlural.toLowerCase()}`;

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          <SubunitsTable
            organizationId={currentOrganization.id}
            units={allUnits}
            unitsLoading={allUnitsLoading}
            unitId={currentUnitSlug}
            unitIdType="slug"
            setUnitsPath={setUnitsPath}
            unitsLabelSingular={
              isUnitContext ? subunitSingular : labels.unitSingular
            }
            unitsLabelPlural={isUnitContext ? subunitPlural : labels.unitPlural}
            render={(children) => (
              <LargeFormSection
                heading={isUnitContext ? subunitPlural : labels.unitPlural}
                subheading={`View all ${labels.unitPlural.toLowerCase()} in this organization.`}
                defaultOpen
              >
                {children}
              </LargeFormSection>
            )}
            onAddSubunitSuccess={() => invalidateAllUnitsQuery()}
          />
          {isUnitContext && currentUnit && (
            <LargeFormSection
              heading="SOS Locations"
              subheading="Provide physical locations for safety concern (SOS) posters and other reporting tools."
              defaultOpen
            >
              <SOSLocationsTable unitId={currentUnit.id} />
            </LargeFormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrganizationUnits;
