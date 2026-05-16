import { useContext, useMemo } from "react";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { labelsForPreset } from "../../../utils/labels";
import SOSLocationsTable from "../components/SOSLocationsTable";
import SubunitsTable from "../components/SubunitsTable";

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="mb-5 border-b-2 border-primary-500/30 pb-2 text-base font-semibold tracking-tight text-gray-900">
    {children}
  </h3>
);

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

  const labels = useMemo(
    () => labelsForPreset(currentOrganization?.labelPreset),
    [currentOrganization?.labelPreset],
  );
  const subunitSingular = `Sub-${labels.unitSingular.toLowerCase()}`;
  const subunitPlural = `Sub-${labels.unitPlural.toLowerCase()}`;

  if (currentOrganizationLoading || !currentOrganization) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  const subunitsTable = (
    <SubunitsTable
      organizationId={currentOrganization.id}
      units={allUnits}
      unitsLoading={allUnitsLoading}
      unitId={currentUnitSlug}
      unitIdType="slug"
      setUnitsPath={setUnitsPath}
      unitsLabelSingular={isUnitContext ? subunitSingular : labels.unitSingular}
      unitsLabelPlural={isUnitContext ? subunitPlural : labels.unitPlural}
      onAddSubunitSuccess={() => invalidateAllUnitsQuery()}
    />
  );

  // Unit context shows two distinct sections — Sub-units and the unit's
  // SOS Locations — so each gets a header to disambiguate. Org context has
  // a single section that the tab name already identifies; no h3 needed.
  if (!isUnitContext) {
    return (
      <div className="rounded-lg bg-white p-6 ring-1 ring-gray-900/5">
        {subunitsTable}
      </div>
    );
  }

  return (
    <div className="space-y-12 rounded-lg bg-white p-6 ring-1 ring-gray-900/5">
      <section>
        <SectionHeader>{subunitPlural}</SectionHeader>
        {subunitsTable}
      </section>

      {currentUnit && (
        <section>
          <SectionHeader>SOS Locations</SectionHeader>
          <p className="mb-4 max-w-prose text-sm text-gray-600">
            Locations routed to this unit's TAT. New locations created here are
            pinned to this unit.
          </p>
          <SOSLocationsTable unitId={currentUnit.id} />
        </section>
      )}
    </div>
  );
};

export default MyOrganizationUnits;
