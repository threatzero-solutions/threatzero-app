import dayjs from "dayjs";
import { TrainingSection } from "../types/entities";

export const trainingSectionSort = (a: TrainingSection, b: TrainingSection) => {
  const diff = dayjs(a.availableOn).diff(b.availableOn, "day");
  if (diff !== 0) {
    return diff;
  }

  return a.order - b.order;
};

export const isSectionAvailable = (section: TrainingSection) => {
  const today = dayjs();
  return (
    (today.isSame(section.availableOn, "day") ||
      today.isAfter(section.availableOn, "day")) &&
    (!section.expiresOn ||
      today.isBefore(section.expiresOn, "day") ||
      today.isSame(section.expiresOn, "day"))
  );
};

export const getAvailableSection = (sections: TrainingSection[]) =>
  sections.find(isSectionAvailable);
