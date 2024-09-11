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
  trainingCourseId: string;
  trainingItemId: string;
}

export interface ResendTrainingLinksDto {
  trainingTokenIds: string[];
  trainingUrlTemplate: string;
}

export interface BaseMatcherDto {
  attributeId?: string;
  externalName: string;
  pattern: string;
}

export interface UnitMatcherDto extends BaseMatcherDto {
  unitSlug: string;
}

export interface AudienceMatcherDto extends BaseMatcherDto {
  audience: string;
}

export interface RoleGroupMatcherDto extends BaseMatcherDto {
  roleGroup: string;
}

export interface OrganizationIdpDto {
  slug: string;
  name: string;
  protocol: string;
  domains: string[];
  unitMatchers: UnitMatcherDto[];
  audienceMatchers: AudienceMatcherDto[];
  roleGroupMatchers: RoleGroupMatcherDto[];
  defaultRoleGroups: string[];
  importedConfig: Record<string, string>;
}
