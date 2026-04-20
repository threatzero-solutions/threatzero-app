/**
 * Role assignment surface for an organization. Replaces scattered
 * role-group controls (KC-backed) with a single DB-native editor.
 *
 * Sub-tabs:
 *   - Assignments: the live table of users with editable org-level grants.
 *   - History: paginated audit feed of grant/revoke events.
 *
 * Sub-tab state is persisted in `?view=assignments|history` so deep links
 * and browser back/forward behave predictably.
 */
import { useContext } from "react";
import { useSearchParams } from "react-router";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { classNames } from "../../../utils/core";
import OrganizationsAccessAssignments from "../components/OrganizationsAccessAssignments";
import OrganizationsAccessHistory from "../components/OrganizationsAccessHistory";

type AccessView = "assignments" | "history";

const VIEW_KEY = "view";

const isAccessView = (v: string | null): v is AccessView =>
  v === "assignments" || v === "history";

const OrganizationsAccess: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading } =
    useContext(OrganizationsContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(VIEW_KEY);
  const view: AccessView = isAccessView(raw) ? raw : "assignments";

  const setView = (next: AccessView) => {
    const params = new URLSearchParams(searchParams);
    if (next === "assignments") {
      params.delete(VIEW_KEY);
    } else {
      params.set(VIEW_KEY, next);
    }
    setSearchParams(params, { replace: true });
  };

  if (currentOrganizationLoading || !currentOrganization) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Access views"
        className="flex gap-1 rounded-lg bg-gray-100 p-1 w-max"
      >
        <SubTabButton
          active={view === "assignments"}
          onClick={() => setView("assignments")}
        >
          Assignments
        </SubTabButton>
        <SubTabButton
          active={view === "history"}
          onClick={() => setView("history")}
        >
          History
        </SubTabButton>
      </div>

      {view === "assignments" ? (
        <OrganizationsAccessAssignments
          orgId={currentOrganization.id}
          orgName={currentOrganization.name}
        />
      ) : (
        <OrganizationsAccessHistory
          orgId={currentOrganization.id}
          orgName={currentOrganization.name}
        />
      )}
    </div>
  );
};

const SubTabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={classNames(
      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500",
      active
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900",
    )}
  >
    {children}
  </button>
);

export default OrganizationsAccess;
