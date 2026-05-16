/**
 * Role assignment surface for an organization. The users table is the
 * primary content; the change log lives behind a "Change log" button
 * that opens a slide-over panel without unmounting the table (no lost
 * scroll / search / sort state).
 *
 * The slide-over's open state is bound to `?view=history` so deep links
 * and browser back/forward still work — closing the panel drops the
 * query param.
 */
import { useContext } from "react";
import { useSearchParams } from "react-router";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import OrganizationsAccessAssignments from "../components/OrganizationsAccessAssignments";
import OrganizationsAccessHistory from "../components/OrganizationsAccessHistory";

const VIEW_KEY = "view";
const HISTORY_VIEW = "history";

const OrganizationsAccess: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading } =
    useContext(OrganizationsContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const historyOpen = searchParams.get(VIEW_KEY) === HISTORY_VIEW;

  const setHistoryOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (open) {
      params.set(VIEW_KEY, HISTORY_VIEW);
    } else {
      params.delete(VIEW_KEY);
    }
    setSearchParams(params, { replace: true });
  };

  if (currentOrganizationLoading || !currentOrganization) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  return (
    <>
      <OrganizationsAccessAssignments
        orgId={currentOrganization.id}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <SlideOver open={historyOpen} setOpen={setHistoryOpen}>
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Change log
              </h2>
              <p className="text-sm text-gray-500">
                Grant and revoke events for {currentOrganization.name}.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close change log"
            >
              <span aria-hidden className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <OrganizationsAccessHistory orgId={currentOrganization.id} />
          </div>
        </div>
      </SlideOver>
    </>
  );
};

export default OrganizationsAccess;
