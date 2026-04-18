/**
 * Slide-over editor for a single user's organization-scoped role grants.
 * Writes to the DB-native access-management API (no Keycloak groups).
 *
 * Scope in this first cut:
 *  - Edits ORG-level grants only (organization-admin, training-admin,
 *    tat-member at org scope). Unit-scoped grants (member role, per-unit
 *    TAT) are managed from the TAT panel and a future unit-assignment UI.
 *  - Authority enforcement is server-side (assertAssignerCanGrant). We
 *    reflect it in the UI by omitting roles the current actor cannot
 *    assign (e.g., system-admin is absent for org-admins).
 *
 * Interaction model: simple checkbox list of assignable roles. Save
 * performs a replace-with-set PATCH over the user's ORG-level grants
 * (unit grants are preserved — the PATCH carries them back unchanged).
 */
import { useMemo, useState } from "react";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { UserWithGrants } from "../../../queries/grants";
import { usePatchUserGrants } from "../../../queries/use-grants";

/** Roles an org-admin can assign. system-admin is intentionally absent. */
const ORG_SCOPE_ROLES: Array<{
  slug: string;
  name: string;
  description: string;
}> = [
  {
    slug: "organization-admin",
    name: "Organization Admin",
    description: "Full access within the organization.",
  },
  {
    slug: "training-admin",
    name: "Training Admin",
    description: "Manage training content and assignments.",
  },
  {
    slug: "tat-member",
    name: "TAT (Org-level)",
    description: "Member of the organization-wide threat assessment team.",
  },
];

export interface RoleAssignmentEditorProps {
  orgId: string;
  user: UserWithGrants | null;
  open: boolean;
  onClose: () => void;
}

export default function RoleAssignmentEditor({
  orgId,
  user,
  open,
  onClose,
}: RoleAssignmentEditorProps) {
  const mutation = usePatchUserGrants(orgId);

  // Initial ORG-level role slugs for this user (unitId === null).
  const initialOrgRoles = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      user.grants.filter((g) => g.unitId == null).map((g) => g.roleSlug),
    );
  }, [user]);

  const [selected, setSelected] = useState<Set<string>>(initialOrgRoles);
  // Re-seed when the target user changes.
  useMemo(() => setSelected(initialOrgRoles), [initialOrgRoles]);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const dirty = useMemo(() => {
    if (selected.size !== initialOrgRoles.size) return true;
    for (const s of selected) if (!initialOrgRoles.has(s)) return true;
    return false;
  }, [selected, initialOrgRoles]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Build the full desired set: preserved unit-scoped grants + new
    // org-scoped selection. PATCH is replace-with-set, so we must include
    // everything we want to keep.
    const unitGrants = user.grants
      .filter((g) => g.unitId != null)
      .map((g) => ({ roleSlug: g.roleSlug, unitId: g.unitId! }));

    const orgGrants = [...selected].map((slug) => ({ roleSlug: slug }));

    mutation.mutate(
      { userId: user.id, grants: [...orgGrants, ...unitGrants] },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <SlideOver open={open} setOpen={onClose}>
      <SlideOverForm
        onSubmit={onSubmit}
        onClose={onClose}
        hideDelete
        submitText="Save roles"
        submitDisabled={!dirty || mutation.isPending}
        isSaving={mutation.isPending}
      >
        <SlideOverHeading
          title="Edit roles"
          description={user?.email ?? ""}
          setOpen={(v) => !v && onClose()}
        />

        <SlideOverFormBody>
          <div className="px-4 py-6 sm:px-6">
            <p className="text-sm text-gray-600">
              Select the organization-wide roles this user should hold.
              Unit-specific assignments are managed separately and will be
              preserved.
            </p>

            <ul className="mt-4 space-y-3">
              {ORG_SCOPE_ROLES.map((r) => {
                const checked = selected.has(r.slug);
                return (
                  <li
                    key={r.slug}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-300"
                  >
                    <input
                      id={`role-${r.slug}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(r.slug)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label
                      htmlFor={`role-${r.slug}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="block text-sm font-medium text-gray-900">
                        {r.name}
                      </span>
                      <span className="block text-sm text-gray-500">
                        {r.description}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {mutation.isError && (
              <p className="mt-4 text-sm text-red-600">
                Couldn&apos;t save changes. Please try again.
              </p>
            )}
          </div>
        </SlideOverFormBody>
      </SlideOverForm>
    </SlideOver>
  );
}
