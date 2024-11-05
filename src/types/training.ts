import { Updater } from "use-immer";
import { TrainingMetadata, TrainingSection, Video } from "./entities";
import { Dayjs } from "dayjs";
import { SCORM_VERSIONS } from "../constants/training";

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
