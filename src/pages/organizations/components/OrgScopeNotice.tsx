import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { ReactNode, useContext } from "react";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";

export interface OrgScopeNoticeProps {
  /**
   * Body copy explaining how the setting cascades. Receives the resolved
   * org + unit names so prose can weave them in naturally.
   */
  description: (names: { orgName: string; unitName: string }) => ReactNode;
}

export const OrgScopeNotice: React.FC<OrgScopeNoticeProps> = ({
  description,
}) => {
  const { currentOrganization, currentUnit, setUnitsPath } =
    useContext(OrganizationsContext);

  const orgName = currentOrganization?.name ?? "the organization";
  const unitName = currentUnit?.name ?? "this unit";

  return (
    <div className="max-w-[58ch] py-6">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-700">
        Organization-level setting
      </p>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-gray-900">
        Managed at {orgName}.
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {description({ orgName, unitName })}
      </p>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setUnitsPath(null)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Switch to {orgName}
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
