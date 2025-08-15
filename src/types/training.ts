import { Dayjs } from "dayjs";
import { Updater } from "use-immer";
import { SCORM_VERSIONS } from "../constants/training";
import { TrainingMetadata, TrainingSection, Video } from "./entities";

export type EditableItem = Partial<Video> & { metadata: TrainingMetadata };
export type ItemUpdater = Updater<EditableItem>;

export type TrainingAvailability = "upcoming" | "ended" | "ongoing";

export type FeaturedWindow = {
  featuredOn: Dayjs;
  featuredUntil: Dayjs;
};

export type SectionAndWindow = {
  window: FeaturedWindow | null;
  section: TrainingSection;
};

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
