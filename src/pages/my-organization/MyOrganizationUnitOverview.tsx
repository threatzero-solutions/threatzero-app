import { Link, useParams } from "react-router";
import { useAuth } from "../../contexts/auth/useAuth";
import OrganizationUnitOverview from "./components/OrganizationUnitOverview";
import { humanizeSlug } from "../../utils/core";
import { useMemo } from "react";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";

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
      <nav aria-label="Breadcrumb" className="flex">
        <ol role="list" className="flex items-center space-x-4">
          <li>
            <div>
              <Link to="../" className="text-gray-400 hover:text-gray-500">
                <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sr-only">My Organization</span>
              </Link>
            </div>
          </li>
          {paths.map((path, idx) => (
            <li key={path}>
              <div className="flex items-center">
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray-400"
                />
                <Link
                  to={`../units/${paths.slice(0, idx + 1).join("/")}`}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {humanizeSlug(path)}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </nav>
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
