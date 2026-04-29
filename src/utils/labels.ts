import type { MeOrganizationLabelPreset } from "../types/me";

/**
 * Vocabulary bundle for an organization. Every preset returns the same
 * four fields so callers can depend on them without null-checking.
 *
 * - `unit*` — the substructure of an organization (what this codebase
 *   used to unconditionally call "unit"). A school district sees
 *   "School"/"Schools"; a company sees "Site"/"Sites".
 * - `team*` — the collective grouping inside an organization used on
 *   the dashboard ("Team & management" divider, "Team training
 *   overview" heading, "Your team view" badge). Schools that don't
 *   have an intra-org "team" concept fall back to "School" to match
 *   the unit language.
 *
 * Keep the preset list in sync with `OrganizationLabelPreset` on the
 * backend (`src/organizations/organizations/entities/organization.entity.ts`)
 * and with the mirror on the frontend (`src/types/me.ts`).
 */
export interface OrganizationLabelBundle {
  unitSingular: string;
  unitPlural: string;
  teamSingular: string;
  teamPlural: string;
}

const PRESETS: Record<MeOrganizationLabelPreset, OrganizationLabelBundle> = {
  default: {
    unitSingular: "Unit",
    unitPlural: "Units",
    teamSingular: "Team",
    teamPlural: "Teams",
  },
  school: {
    unitSingular: "School",
    unitPlural: "Schools",
    // Schools tend to think at the school level, not across the district as a
    // single "team". Pin team language to school so the dashboard reads
    // naturally: "School & management", "School training overview".
    teamSingular: "School",
    teamPlural: "Schools",
  },
  business: {
    unitSingular: "Site",
    unitPlural: "Sites",
    // Matches the usual "company team" vocabulary. Keeping the team label
    // distinct from the unit label reads more natural here than collapsing
    // them like we do for schools.
    teamSingular: "Team",
    teamPlural: "Teams",
  },
};

export const DEFAULT_LABEL_BUNDLE: OrganizationLabelBundle = PRESETS.default;

/**
 * Returns the label bundle for a preset. Accepts `null`/`undefined` so
 * callers can pass `me?.organization?.labelPreset` directly — an
 * unknown preset (shouldn't happen, but be defensive about a server
 * rolling out a new value before the client catches up) falls back to
 * the default bundle.
 */
export const labelsForPreset = (
  preset: MeOrganizationLabelPreset | null | undefined,
): OrganizationLabelBundle => {
  if (!preset) return DEFAULT_LABEL_BUNDLE;
  return PRESETS[preset] ?? DEFAULT_LABEL_BUNDLE;
};
