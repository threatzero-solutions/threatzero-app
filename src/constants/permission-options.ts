import { LEVEL, READ, WRITE } from "./permissions";

// TRAINING
export const trainingLibraryPermissionsOptions = {
  permissions: [READ.COURSES],
};

export const trainingItemPermissionsOptions = {
  permissions: [READ.COURSES],
};

export const courseBuilderPermissionsOptions = {
  permissions: [LEVEL.ADMIN, WRITE.COURSES],
};

// FORMS
export const formBuilderPermissionsOptions = {
  permissions: [LEVEL.ADMIN, WRITE.FORMS],
};

// SAFETY MANAGEMENT
export const safetyManagementPermissionOptions = {
  type: "any" as const,
  permissions: [
    READ.TIPS,
    READ.THREAT_ASSESSMENTS,
    READ.VIOLENT_INCIDENT_REPORTS,
    READ.TRAINING_STATS,
    WRITE.TRAINING_LINKS,
  ],
};

export const safetyConcernPermissionsOptions = {
  permissions: [READ.TIPS],
};

export const threatAssessmentPermissionsOptions = {
  permissions: [READ.THREAT_ASSESSMENTS],
};

export const violentIncidentReportPermissionsOptions = {
  permissions: [READ.VIOLENT_INCIDENT_REPORTS],
};

export const trainingAdminPermissionOptions = {
  permissions: [WRITE.TRAINING_LINKS, READ.TRAINING_STATS],
  type: "any" as const,
};

// RESOURCES
export const resourcePermissionsOptions = {
  permissions: [READ.RESOURCES],
};

// ADMIN PANEL
export const adminPanelPermissionOptions = {
  permissions: [LEVEL.ADMIN],
  type: "all" as const,
};

// MY ORGANIZATION
export const myOrganizationPermissionOptions = {
  permissions: [READ.ORGANIZATIONS],
  type: "all" as const,
};

export const organizationUserPermissionOptions = {
  permissions: [READ.ORGANIZATION_USERS],
  type: "all" as const,
};

export const organizationTrainingManagementPermissionOptions = {
  permissions: [READ.COURSE_ENROLLMENTS, WRITE.COURSE_ENROLLMENTS, WRITE.ORGANIZATION_USERS],
  type: "any" as const,
};

export const organizationSafetyManagementPermissionOptions = {
  permissions: [WRITE.ORGANIZATIONS],
  type: "all" as const,
};

export const organizationSettingsPermissionOptions = {
  permissions: [WRITE.ORGANIZATIONS],
  type: "all" as const,
};
