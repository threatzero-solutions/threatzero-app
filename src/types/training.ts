import { Updater } from "use-immer";
import { TrainingMetadata, Video } from "./entities";

export type EditableItem = Partial<Video> & { metadata: TrainingMetadata };
export type ItemUpdater = Updater<EditableItem>;

export type TrainingAvailability = "upcoming" | "ended" | "ongoing";
