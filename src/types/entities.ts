export interface Base {
  id: string;
  createdOn: string;
  updatedOn: string;
}

export interface Paginated<T> {
  results: T[];
  count: number;
  offset: number;
  limit: number;
}

// ------------------ LANGUAGES ------------------

export interface Language extends Base {
  code: string;
  name: string;
  nativeName: string;
}

// ------------------ ORGANIZATIONS ------------------

export interface OrganizationBase extends Base {
  /** Unique human friendly identifier. */
  slug: string;
  name: string;
  address: string | null;
  safetyContact?: SafetyContact;
  policiesAndProcedures: OrganizationPolicyFile[];
}

/** Represents an organization (ie district, company, etc.) */
export interface Organization extends OrganizationBase {
  groupId: string | null;
  courses?: TrainingCourse[];
  resources?: ResourceItem[];
}

/** Represents a unit of an organization (ie school, office, college, etc.) */
export interface Unit extends OrganizationBase {
  organization: Organization;
  groupId: string | null;
  tatGroupId: string | null;
}

export interface Location extends Base {
  unit: Unit;
  name: string;
  locationId: string;
}

// ------------------ TRAINING ------------------

/** The audience training material is available to. */
export interface Audience extends Base {
  /** Unique human friendly identifier. */
  slug: string;
}

export enum TrainingVisibility {
  VISIBLE = "visible",
  HIDDEN = "hidden",
}

/** Metadata about a piece of training material. */
export interface TrainingMetadata {
  title: string;
  description?: string;
  tag?: string;
}

/** A group of training sections. */
export interface TrainingCourse extends Base {
  metadata: TrainingMetadata;
  visibility: TrainingVisibility;
  organizations: Organization[];
  sections: TrainingSection[];
  audiences: Audience[];
  presentableBy: Audience[];
}

export enum TrainingRepeats {
  YEARLY = "yearly",
  ONCE = "once",
}

/** A group of training items. */
export interface TrainingSection extends Base {
  metadata: TrainingMetadata;
  order: number;
  items: TrainingSectionItem[] | null;
  availableOn: string;
  expiresOn: string | null;
  repeats: TrainingRepeats;
  courseId: string | null;
}

/** Joins a training section to a training item with
 * additional metadata.
 */
export interface TrainingSectionItem extends Base {
  order: number;
  item: TrainingItem;
}

/** The fundamental unit of training material. */
export interface TrainingItem extends Base {
  metadata: TrainingMetadata;

  thumbnailKey: string | null;
  thumbnailUrl: string | null;

  prerequisiteItems: TrainingItem[];
  prerequisitesFulfilled: boolean;

  estCompletionTime: object | null;

  type: string;
}

/** A training item of type video. */
export interface Video extends TrainingItem {
  mediaKeys: string[];
  mediaUrls?: string[];
  embeddedHtml?: string;
  vimeoUrl?: string;
  encodingJobId: string | null;
  abrEnabled: boolean;
}

export enum TrackingStatus {
  NOT_COMPLETE = "not_complete",
  COMPLETE = "complete",
}

export enum TrackingType {
  INDIVIDUAL = "individual",
  PROXY = "proxy",
}

/** Tracks a user's completion of a training item. */
export interface UserTrainingCheckpoint extends Base {
  userId?: string;
  status: TrackingStatus;
  audienceSlug: string;
  completionDate: string | null;
  trainingItem: TrainingItem;
  type: TrackingType;
}

// ------------------ FORMS ------------------

export enum FormState {
  DRAFT = "draft",
  PUBLISHED = "published",
}

/** A generic form. */
export interface Form extends Base {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  fields?: Field[];
  groups?: FieldGroup[];
  state: FormState;
  version: number;
  language: Language;
}

export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  SELECT = "select",
  CHECKBOX = "checkbox",
  TEXTAREA = "textarea",
  FILE = "file",
  EMAIL = "email",
  TEL = "tel",
  RADIO = "radio",
  RANGE = "range",
  COLOR = "color",
  DATETIME_LOCAL = "datetime-local",
  SEARCH = "search",
  TIME = "time",
  URL = "url",
  NONE = "none",
}

export enum InternalFieldType {
  JSON = "json",
  HTML = "html",
  HIDDEN = "hidden",
}

/** Generic form fields. */
export interface Field extends Base {
  name: string;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  type: FieldType | InternalFieldType;
  elementProperties: object;
  typeParams: object;
  required: boolean;
  order: number;
  form?: Form | null;
  group?: FieldGroup | null;
}

export interface FieldGroup extends Base {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  order: number;
  fields?: Field[];
  form?: Form;
  parentGroup: FieldGroup | null;
  childGroups?: FieldGroup[];
}

export enum FormSubmissionState {
  NOT_COMPLETE = "not_complete",
  COMPLETE = "complete",
}

/** An individaul's form submission. */
export interface FormSubmission extends Base {
  userId: string | null;
  ipv4: string | null;
  ipv6: string | null;
  formId: string | null;
  form: Form;
  status: FormSubmissionState;
  fieldResponses: FieldResponse[];
}

export interface FieldResponse {
  value: unknown;
  field: Field;
  loadedValue?: unknown;
}

export interface UserRepresentation extends Base {
  externalId: string;
  email: string;
  name: string | null;
  picture: string | null;
  givenName: string | null;
  familyName: string | null;
  organizationSlug: string | null;
  unitSlug: string | null;
}

export interface Note extends Base {
  value: string;
  user: UserRepresentation | null;
}

// ------------------ SAFETY MANAGEMENT ------------------

export interface SafetyContact extends Base {
  name: string;
  email: string;
  phone: string;
  title?: string;
}

export interface OrganizationPolicyFile extends Base {
  name: string;
  pdfS3Key: string;
  pdfUrl?: string;
}

interface SafetyResourceBase extends Base {
  tag?: string;
  unitSlug: string;
  unit: Unit;
  submission: FormSubmission;
}

export interface POCFile extends Base {
  pocFirstName: string;
  pocLastName: string;
  unit: Unit;
  tips: Tip[];
  assessments: ThreatAssessment[];
}

export enum TipStatus {
  NEW = "new",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
}

/** Metadata about a tip and its form submission. */
export interface Tip extends SafetyResourceBase {
  location?: Location;
  pocFiles: POCFile[];
  informantFirstName: string;
  informantLastName: string;
  informantEmail: string;
  informantPhone: string;
  notes: Note[];
  status: TipStatus;
}

export enum AssessmentStatus {
  IN_PROGRESS = "in_progress",
  CONCLUDED_MANAGEMENT_ONGOING = "concluded_management_ongoing",
  CONCLUDED_MANAGEMENT_COMPLETE = "concluded_management_complete",
  CLOSED_SUPERFICIAL_THREAT = "closed_superficial_threat",
}

/** Metadata about a threat assessment and its form submission. */
export interface ThreatAssessment extends SafetyResourceBase {
  pocFiles: POCFile[];
  status: AssessmentStatus;
  statusName?: string;
}

export enum ViolentIncidentReportStatus {
  NEW = "new",
  REVIEWED = "reviewed",
}

export interface ViolentIncidentReport extends SafetyResourceBase {
  pocFiles: POCFile[];
  status: ViolentIncidentReportStatus;
  statusName?: string;
}

// ------------------ SURVEYS ------------------

export interface UserSurvey extends Base {
  slug: string;
  formSlug: string;
  formVersion: number;
  form?: Form;
  audiences?: Audience[];
  triggerOnStart: boolean;
  initialDelay: object;
  repeatAfter: object;
  required: boolean;
}

export enum UserSurveyResponseStatus {
  COMPLETE = "complete",
  NOT_COMPLETE = "not_complete",
  DISMISSED = "dismissed",
}

export interface UserSurveyResponse extends Base {
  userSurvey: UserSurvey;
  unitSlug: string;
  unit: Unit;
  submission: FormSubmission | null;
  status: UserSurveyResponseStatus;
  closedOn: string | null;
}

export enum VideoEventType {
  PLAY = "play",
  END = "end",
  ERROR = "error",
  PAUSE = "pause",
  PROGRESS = "progress",
  READY = "ready",
  BUFFER = "buffer",
  DURATION = "duration",
  START = "start",
  SEEK = "seek",
  BUFFER_END = "buffer_end",
  CLICK_PREVIEW = "click_preview",
  ENABLE_PIP = "enable_pip",
  DISABLE_PIP = "disable_pip",
}

export interface VideoEvent {
  timestamp: string;
  type: VideoEventType;
  itemId?: string;
  sectionId?: string;
  courseId?: string;
  videoId?: string;
  eventData: unknown;
  url: string;
}

export const ResourceItemCategories = [
  "prevention",
  "preparation",
  "response",
  "resiliency",
] as const;

export type ResourceItemCategory = (typeof ResourceItemCategories)[number];

export enum ResourceType {
  VIDEO = "video",
  DOCUMENT = "document",
}

export interface ResourceItem extends Base {
  fileKey?: string;
  resourceUrl?: string;
  vimeoUrl?: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  type: ResourceType;
  category: ResourceItemCategory;
  organizations: Organization[];
}

// USERS

export interface OpaqueToken extends Base {
  key: string;
  value: Record<string, any>;
}

export interface WatchStat {
  trainingItemId: string;
  trainingItemTitle: string;
  trainingCourseId: string | null;
  percentWatched: string;
  year: number;
  userId: string | null;
  userExternalId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName: string | null;
  unitId: string | null;
  unitSlug: string | null;
  unitName: string | null;
}
