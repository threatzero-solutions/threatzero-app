import { Dayjs } from "dayjs";
import { Updater } from "use-immer";
import { SCORM_VERSIONS } from "../constants/training";
import { TrainingMetadata, TrainingSection, Video } from "./entities";

export type EditableItem = Partial<Video> & { metadata: TrainingMetadata };
export type ItemUpdater = Updater<EditableItem>;

export type TrainingAvailability = "upcoming" | "ended" | "ongoing";

export interface FeaturedWindow {
  featuredOn: Dayjs;
  featuredUntil: Dayjs;
}

export interface SectionAndWindow {
  window: FeaturedWindow;
  section: TrainingSection;
}

export type SectionAndNullableWindow =
  | Exclude<SectionAndWindow, { window: null }> & {
      window: null;
    };

export interface SectionAndWindowWithRelativeAvailability
  extends SectionAndWindow {
  relativeAvailability: TrainingAvailability;
}

export type ScormVersion = (typeof SCORM_VERSIONS)[number];

export interface RelativeEnrollmentDto {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
  visibility: string;
  organizationId: string;
  isEarliest: boolean;
  isLatest: boolean;
}
