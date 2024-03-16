import dayjs from 'dayjs';
import { TrainingSection } from '../types/entities';

export const trainingSectionSort = (a: TrainingSection, b: TrainingSection) => {
  const diff = dayjs(a.availableOn).diff(b.availableOn, 'day');
  if (diff !== 0) {
    return diff;
  }

  return a.order - b.order;
};

export const isSectionAvailable = (section: TrainingSection) =>
  dayjs().isAfter(section.availableOn) &&
  (!section.expiresOn || dayjs().isBefore(section.expiresOn));

export const getAvailableSection = (sections: TrainingSection[]) =>
  sections.find(isSectionAvailable);
