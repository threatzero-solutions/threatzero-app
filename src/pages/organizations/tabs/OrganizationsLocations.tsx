import { useContext } from "react";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import SOSLocationsTable from "../components/SOSLocationsTable";

const OrganizationsLocations: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading } =
    useContext(OrganizationsContext);

  if (currentOrganizationLoading || !currentOrganization) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  return (
    <div className="rounded-lg bg-white p-6 ring-1 ring-gray-900/5">
      <p className="mb-4 max-w-prose text-sm text-gray-600">
        Each location has its own QR code and unique link. Tie a location to a
        unit to route reports to that unit's TAT, or leave it organization-wide
        so any TAT member for the organization is notified.
      </p>
      <SOSLocationsTable />
    </div>
  );
};

export default OrganizationsLocations;
