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

export interface UnitMatcherDto {
  attributeId?: string;
  externalName: string;
  pattern: string;
  unitSlug: string;
}

export interface OrganizationIdpDto {
  slug: string;
  name: string;
  protocol: string;
  domains: string[];
  unitMatchers: UnitMatcherDto[];
  defaultRoleGroups: string[];
  importedConfig: Record<string, string>;
}
