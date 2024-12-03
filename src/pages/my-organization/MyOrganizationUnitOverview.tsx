import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/auth/useAuth";
import OrganizationUnitOverview from "./components/OrganizationUnitOverview";
import { humanizeSlug } from "../../utils/core";
import { useMemo } from "react";

const MyOrganizationUnitOverview = () => {
  const { accessTokenClaims } = useAuth();
  const { "*": unitsPath } = useParams();

  const organizationSlug = useMemo(
    () =>
      accessTokenClaims?.organization
        ? `${accessTokenClaims?.organization}`
        : null,
    [accessTokenClaims]
  );
  const paths = useMemo(() => unitsPath?.split("/") ?? [], [unitsPath]);

  return (
    <div className="space-y-4">
      {[organizationSlug ?? "", ...paths].map((slug, idx) => (
        <>
          {idx > 0 && " / "}
          <Link
            key={idx}
            to={idx === 0 ? "../" : `../units/${paths.slice(0, idx).join("/")}`}
            className="text-gray-900 hover:text-gray-600 text-sm underline"
          >
            {idx === 0 ? "My Organization" : humanizeSlug(slug)}
          </Link>
        </>
      ))}
      <OrganizationUnitOverview
        organizationId={organizationSlug}
        organizationIdType="slug"
        unitId={unitsPath?.split("/").pop()}
        unitIdType="slug"
        unitsRoot="../units"
      />
    </div>
  );
};

export default MyOrganizationUnitOverview;
