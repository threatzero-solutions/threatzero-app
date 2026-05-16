import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useMe } from "../../../contexts/me/MeProvider";
import { ME_QUERY_KEY, setMyResidence } from "../../../queries/me";
import { getUnits } from "../../../queries/organizations";
import { Unit } from "../../../types/entities";
import { classNames } from "../../../utils/core";
import { labelsForPreset } from "../../../utils/labels";

interface UnitOption {
  id: string;
  slug: string;
  name: string;
}

/**
 * Adaptive callout below the safety-concern submit form. Two variants:
 *
 *  1. Residence is set → static "This concern will go to *<unit>*."
 *  2. Residence is unset (no row, or row with `unitId === null`) → inline,
 *     non-blocking picker that does a single-step set on click.
 *
 * Hidden when:
 *   - The user is not authenticated, or
 *   - Their scope is not `tenant` (system / personal don't route by
 *     residence), or
 *   - A `loc_id` is present in the URL — public location-coded URLs route
 *     by the location's unit, not the submitter's residence.
 *
 * See `_docs/residence-and-tenant-model.md` §6 (Concerns/tips callout).
 */
const RoutingCallout: React.FC<{ hasLocationId: boolean }> = ({
  hasLocationId,
}) => {
  const { authenticated } = useAuth();
  const { me } = useMe();
  const queryClient = useQueryClient();

  const tenantOrgId = me?.scope.kind === "tenant" ? me.organization?.id : null;
  const labels = labelsForPreset(me?.organization?.labelPreset);

  const residence = useMemo(
    () =>
      tenantOrgId
        ? me?.residences.find((r) => r.organizationId === tenantOrgId)
        : undefined,
    [me, tenantOrgId],
  );

  const residenceSet = !!residence?.unitId;
  // Show the inline picker only when we have a tenant org to set residence
  // for. Always-visible callout otherwise — no setup-needed empty state.
  const needsPick = !!tenantOrgId && !residenceSet;

  // Fetch units only when we actually need them for the picker. Filtered
  // client-side using the same logic as the modal UnitPicker.
  const { data: fetchedUnits } = useQuery({
    queryKey: [
      "units",
      {
        "organization.id": tenantOrgId,
        order: { name: "ASC" as const },
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]).then((res) => res.results),
    enabled: needsPick && !!tenantOrgId,
  });

  const accessibleUnitIds = useMemo(() => {
    const ids = new Set<string>();
    Object.keys(me?.capabilities?.units ?? {}).forEach((id) => ids.add(id));
    me?.units?.forEach((u) => ids.add(u.id));
    return ids;
  }, [me]);

  const hasOrgWideGrant = (me?.capabilities?.organization?.length ?? 0) > 0;

  const filteredUnits = useMemo<UnitOption[]>(() => {
    const all = (fetchedUnits ?? []).map((u: Unit) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
    }));
    if (hasOrgWideGrant) return all;
    return all.filter((u) => accessibleUnitIds.has(u.id));
  }, [fetchedUnits, hasOrgWideGrant, accessibleUnitIds]);

  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const setMutation = useMutation({
    mutationFn: (unitId: string) => {
      if (!tenantOrgId) {
        return Promise.reject(new Error("Missing organization context."));
      }
      return setMyResidence(tenantOrgId, unitId);
    },
    onMutate: (unitId) => {
      setError(null);
      setPendingId(unitId);
    },
    onSettled: () => {
      setPendingId(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not save unit.");
    },
  });

  if (!authenticated || !tenantOrgId || hasLocationId) return null;

  if (residenceSet) {
    return (
      <p className="mt-6 text-sm text-gray-600">
        Your safety concern will be reviewed by{" "}
        <span className="font-semibold text-gray-900">
          {residence?.unitName ?? residence?.unitSlug}
        </span>
        ’s threat assessment team.
      </p>
    );
  }

  return (
    <section
      aria-label={`Pick your ${labels.unitSingular.toLowerCase()}`}
      className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4"
    >
      <p className="text-sm text-amber-900">
        Pick your {labels.unitSingular.toLowerCase()} so this concern reaches
        the right people. You can still submit without picking, but routing will
        fall back to the organization.
      </p>

      {filteredUnits.length === 0 ? (
        <p className="mt-3 text-sm text-amber-800">
          No {labels.unitPlural.toLowerCase()} are available for you to pick.
          Contact an administrator.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {filteredUnits.map((u) => {
            const isPending = pendingId === u.id;
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setMutation.mutate(u.id)}
                  disabled={setMutation.isPending}
                  className={classNames(
                    "w-full text-left rounded-md border border-amber-300 bg-white px-3 py-2 text-sm shadow-xs hover:bg-amber-100 disabled:opacity-50",
                    isPending ? "animate-pulse" : "",
                  )}
                >
                  <span className="block font-medium text-gray-900">
                    {u.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

export default RoutingCallout;
