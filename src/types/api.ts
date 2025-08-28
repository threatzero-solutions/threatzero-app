export interface SafetyManagementResourceStats<
  Status extends Record<number, string>
> {
  total: number;
  subtotals: {
    newSince: Record<string, number>;
    statuses: Record<keyof Status, number>;
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

export interface RoleGroupMatcherDto {
  attributeId?: string;
  externalName: string;
  pattern: string;
  roleGroup: string;
}

export interface OrganizationIdpDto {
  slug: string;
  name: string;
  protocol: string;
  domains: string[];
  syncAttributes?: SyncAttributeDto[];
  unitMatchers?: SyncAttributeToAttributeDto[];
  audienceMatchers?: SyncAttributeToAttributeDto[];
  roleGroupMatchers: RoleGroupMatcherDto[];
  defaultRoleGroups: string[];
  defaultAudience?: string | null;
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
  canAccessTraining?: boolean;
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
