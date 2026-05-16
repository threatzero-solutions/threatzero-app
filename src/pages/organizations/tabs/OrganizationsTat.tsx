/**
 * Threat Assessment Team roster + lightweight management.
 *
 * TAT membership IS the `tat-member` access grant (plan decision §1,
 * role-tat-management-plan.md). This page is a curated lens over those
 * grants, grouped by scope: org-level members (unitId=null) on top,
 * per-unit teams below.
 *
 * Writers can add a member per scope via a searchable popover, or remove
 * one via the ✕ button on a member card. Add flows through the
 * replace-with-set PATCH; remove goes through a dedicated DELETE so the
 * page doesn't need to load every user's grant set just to drop one row.
 */
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  TatMember,
  deleteTatMember,
  tatRosterKey,
  usersWithGrantsKey,
} from "../../../queries/grants";
import { useTatRoster } from "../../../queries/use-grants";
import { getUnitAndDescendantIds } from "../../../utils/units";
import TatAddMemberPopover from "../components/TatAddMemberPopover";

const primaryLabel = (m: TatMember) => {
  const joined = [m.givenName, m.familyName].filter(Boolean).join(" ").trim();
  return joined || m.name || m.email || m.idpId || "—";
};

const OrganizationsTat: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    allUnits,
    currentUnit,
    isUnitContext,
  } = useContext(OrganizationsContext);
  const { hasPermissions } = useAuth();
  const {
    setOpen: setConfirmationOpen,
    setConfirmationOptions,
    setClose: setConfirmationClose,
  } = useContext(ConfirmationContext);
  const queryClient = useQueryClient();

  const orgId = currentOrganization?.id;
  const canWrite = hasPermissions([WRITE.ORGANIZATION_USERS]);

  const { data: roster, isLoading } = useTatRoster(orgId);

  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of allUnits ?? []) map.set(u.id, u.name);
    return map;
  }, [allUnits]);

  const { mutate: revokeTat, isPending: isRevoking } = useMutation({
    mutationFn: async ({
      userId,
      unitId,
    }: {
      userId: string;
      unitId: string | null;
    }) => {
      if (!orgId) throw new Error("orgId required");
      await deleteTatMember(orgId, userId, unitId);
    },
    onSuccess: () => {
      if (!orgId) return;
      queryClient.invalidateQueries({ queryKey: tatRosterKey(orgId) });
      queryClient.invalidateQueries({ queryKey: usersWithGrantsKey(orgId) });
      setConfirmationClose();
    },
  });

  useEffect(() => {
    setConfirmationOptions((draft) => {
      draft.isPending = isRevoking;
    });
  }, [isRevoking, setConfirmationOptions]);

  const handleRemove = useCallback(
    (member: TatMember, unitId: string | null) => {
      const scopeLabel = unitId
        ? `${unitNameById.get(unitId) ?? member.unitSlug ?? "unit"} TAT`
        : "organization-wide TAT";
      const who = primaryLabel(member);
      setConfirmationOpen({
        title: "Remove TAT member",
        message: (
          <span>
            Remove <span className="font-bold">{who}</span> from the{" "}
            {scopeLabel}? Their other roles are unchanged.
          </span>
        ),
        onConfirm: () => revokeTat({ userId: member.id, unitId }),
        destructive: true,
        confirmText: "Remove",
      });
    },
    [unitNameById, setConfirmationOpen, revokeTat],
  );

  // In unit context, restrict the view to the selected unit and its
  // descendants — picking a parent in the breadcrumb should surface every
  // sub-unit's TAT, not just the (often empty) parent-level roster. The
  // org-wide section is hidden in unit context.
  const inScopeUnitIds = useMemo(() => {
    if (!isUnitContext || !currentUnit) return null;
    return new Set(getUnitAndDescendantIds(allUnits, currentUnit.id));
  }, [isUnitContext, currentUnit, allUnits]);

  if (currentOrganizationLoading || !currentOrganization || !orgId) {
    return <div className="animate-pulse rounded-sm bg-gray-100 w-full h-96" />;
  }

  const unitEntries = Object.entries(roster?.units ?? {}).filter(
    ([unitId]) => !inScopeUnitIds || inScopeUnitIds.has(unitId),
  );
  const orgExcludeIds = new Set(
    (roster?.organization ?? [])
      .map((m) => m.idpId)
      .filter((id): id is string => !!id),
  );

  const MemberRow: React.FC<{
    member: TatMember;
    unitId: string | null;
  }> = ({ member, unitId }) => {
    const primary = primaryLabel(member);
    const showEmail = member.email && member.email !== primary;
    return (
      <li className="flex items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-900">
            {primary}
          </div>
          {showEmail && (
            <div className="truncate text-xs text-gray-500">{member.email}</div>
          )}
        </div>
        {canWrite && (
          <button
            type="button"
            aria-label={`Remove ${primary} from TAT`}
            onClick={() => handleRemove(member, unitId)}
            className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:text-gray-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            <XMarkIcon className="size-4" />
          </button>
        )}
      </li>
    );
  };

  const SectionHeader: React.FC<{
    label: string;
    addButton?: React.ReactNode;
  }> = ({ label, addButton }) => (
    <div className="mb-1 flex items-baseline justify-between gap-4 border-b border-gray-200 pb-1">
      <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
      {addButton}
    </div>
  );

  return (
    <div className="space-y-10 rounded-lg bg-white p-6 ring-1 ring-gray-900/5">
      <p className="max-w-prose text-sm text-gray-600">
        Members listed here can triage safety concerns and coordinate threat
        assessments. Organization-wide members see every unit; unit-scoped
        members see only theirs.
      </p>
      {!isUnitContext && (
        <section>
          <SectionHeader
            label="Organization-wide"
            addButton={
              canWrite ? (
                <TatAddMemberPopover
                  orgId={orgId}
                  unitId={null}
                  excludeIdpIds={orgExcludeIds}
                />
              ) : undefined
            }
          />
          {isLoading ? (
            <div className="animate-pulse mt-2 h-6 w-48 rounded-sm bg-gray-100" />
          ) : !roster || roster.organization.length === 0 ? (
            <p className="mt-3 text-sm italic text-gray-500">No members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {roster.organization.map((m) => (
                <MemberRow key={m.id} member={m} unitId={null} />
              ))}
            </ul>
          )}
        </section>
      )}

      {isUnitContext &&
        currentUnit &&
        unitEntries.length === 0 &&
        !isLoading && (
          <section>
            <SectionHeader
              label={currentUnit.name}
              addButton={
                canWrite ? (
                  <TatAddMemberPopover
                    orgId={orgId}
                    unitId={currentUnit.id}
                    excludeIdpIds={new Set()}
                  />
                ) : undefined
              }
            />
            <p className="mt-3 text-sm italic text-gray-500">No members yet.</p>
          </section>
        )}

      {unitEntries.length > 0 && (
        <div className="space-y-8">
          {unitEntries.map(([unitId, members]) => {
            const excludeIds = new Set(
              members.map((m) => m.idpId).filter((id): id is string => !!id),
            );
            const unitLabel =
              unitNameById.get(unitId) ?? members[0]?.unitSlug ?? unitId;
            return (
              <section key={unitId}>
                <SectionHeader
                  label={unitLabel}
                  addButton={
                    canWrite ? (
                      <TatAddMemberPopover
                        orgId={orgId}
                        unitId={unitId}
                        excludeIdpIds={excludeIds}
                      />
                    ) : undefined
                  }
                />
                <ul className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <MemberRow key={m.id} member={m} unitId={unitId} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizationsTat;
