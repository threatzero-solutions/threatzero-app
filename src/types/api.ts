/**
 * Stats shape returned by `/tips/stats`, `/threat-assessments/stats`, and
 * `/violent-incident-reports/stats`. The `Status` generic is informational
 * (it documents which enum's values are the status keys) — keys are typed
 * as `string` because the API serializes enum *values* (e.g. "new"), not
 * member names (e.g. "NEW"). Doing `keyof Status` for a TS string enum
 * resolves to `keyof string` and breaks property access.
 */
export interface SafetyManagementResourceStats<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _Status extends Record<number, string> = Record<number, string>,
> {
  total: number;
  subtotals: {
    newSince: Record<string, number>;
    statuses: Record<string, number>;
  };
}

export interface TrainingCheckpointStats {
  total: number;
  totalComplete: number;
  totalNotComplete: number;
  totalsByAudience: {
    [key: string]: {
      complete: number;
      notComplete: number;
    };
  };
}

export interface TrainingParticipantRepresentation {
  trainingItemId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationSlug: string;
  unitSlug: string;
  audiences?: string[];
  expiresOn?: string;
}

export interface SendTrainingLinksDto {
  trainingTokenValues: Partial<TrainingParticipantRepresentation>[];
  trainingUrlTemplate: string;
  courseEnrollmentId: string;
  trainingItemId: string;
  organizationId?: string;
}

export interface SendTrainingReminderDto {
  userId: string;
  courseEnrollmentId: string;
  trainingItemId: string;
}

export interface MarkTrainingCompleteDto {
  userId: string;
  courseEnrollmentId: string;
  trainingItemId: string;
}

export interface ResendTrainingLinksDto {
  trainingTokenIds: string[];
  trainingUrlTemplate: string;
}

export interface BaseMapperDto {
  id?: string;
}

export interface SyncAttributeDto extends BaseMapperDto {
  externalName: string;
  internalName: string;
}

export interface SyncAttributeToAttributeDto extends SyncAttributeDto {
  patterns: { pattern: string; value: string }[];
  patternType: string;
  defaultValue?: string;
  isMultivalue?: boolean;
}

export interface ForwardedClaimDto {
  /** Upstream claim name on the IDP side. */
  externalName: string;
  /**
   * Namespaced key the rule engine matches on. Always persisted as
   * `tz.idp.<short>`; the UI hides the prefix so admins only type
   * the short name.
   */
  claimKey: string;
}

export interface OrganizationIdpDto {
  slug: string;
  name: string;
  protocol: string;
  domains: string[];
  /** Profile attributes synced onto the user (firstName, picture, etc.). */
  syncAttributes?: SyncAttributeDto[];
  /** Raw claim passthrough under `tz.idp.*` for Access Rules to match on. */
  forwardedClaims?: ForwardedClaimDto[];
  importedConfig: Record<string, string>;
}

export interface OrganizationUser {
  id: string;
  enabled: boolean;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  attributes: Record<string, string[] | undefined>;
  groups?: string[];
}

export interface KeycloakGroupDto {
  id: string;
  name: string;
  path?: string;
  attributes?: Record<string, string[]>;
}

export const DurationUnits = [
  "years",
  "months",
  "days",
  "hours",
  "minutes",
  "seconds",
] as const;
export type DurationObject = Partial<
  Record<(typeof DurationUnits)[number], number>
>;

export interface IsUniqueResponse {
  isUnique: boolean;
}
