/**
 * Threat Assessment Team roster. TAT membership IS the `tat-member`
 * access grant (plan decision §1, role-tat-management-plan.md) — this
 * view is a curated lens over those grants, grouped by scope.
 *
 * Org-level team on top (grants with unitId=null). Per-unit teams
 * below. No add/remove controls in this first cut — add capability
 * lives behind the role editor for now. Roster is read-only here so
 * the "team overview" use case is fast to scan.
 */
import { useContext } from "react";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { useTatRoster } from "../../../queries/use-grants";
import { TatMember } from "../../../queries/grants";

const MemberCard: React.FC<{ member: TatMember }> = ({ member }) => {
  const initial = member.email?.charAt(0).toUpperCase() ?? "?";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="h-9 w-9 shrink-0 rounded-full bg-primary-100 text-primary-700 font-medium flex items-center justify-center">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900">
          {member.email ?? "—"}
        </div>
        {member.unitSlug && (
          <div className="text-xs text-gray-500">{member.unitSlug}</div>
        )}
      </div>
    </div>
  );
};

const OrganizationsTat: React.FC = () => {
  const { currentOrganization, currentOrganizationLoading } =
    useContext(OrganizationsContext);
  const orgId = currentOrganization?.id;
  const { data: roster, isLoading } = useTatRoster(orgId);

  if (currentOrganizationLoading || !currentOrganization) {
    return (
      <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
    );
  }

  const unitEntries = Object.entries(roster?.units ?? {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Threat Assessment Team
        </h2>
        <p className="text-sm text-gray-500">
          Members of the TAT for {currentOrganization.name}, grouped by scope.
          Add or remove members via the Access page.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Organization-wide
        </h3>
        {isLoading ? (
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-24" />
        ) : !roster || roster.organization.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
            No organization-level TAT members yet.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roster.organization.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>

      {unitEntries.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Per-unit teams
          </h3>
          <div className="space-y-6">
            {unitEntries.map(([unitId, members]) => (
              <div key={unitId}>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {members[0]?.unitSlug ?? unitId}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m) => (
                    <MemberCard key={m.id} member={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OrganizationsTat;
