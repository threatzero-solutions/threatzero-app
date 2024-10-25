import dayjs, { Dayjs } from "dayjs";
import { CourseEnrollment, TrainingSection } from "../types/entities";
import { TrainingAvailability } from "../types/training";

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

export const getCourseAvailability = (
  startDate: string | null | undefined | Date | Dayjs,
  endDate: string | null | undefined | Date | Dayjs
): TrainingAvailability | null => {
  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;

  if (start) {
    if (start.isAfter(dayjs())) {
      return "upcoming";
    } else if (end && end.isBefore(dayjs())) {
      return "ended";
    } else {
      return "ongoing";
    }
  }

  return null;
};

const scoreEnrollment = (
  enrollment: CourseEnrollment,
  userAudiences: string[]
) => {
  const availability = getCourseAvailability(
    enrollment.startDate,
    enrollment.endDate
  );
  const matchesAudience = enrollment.course.audiences.some((a) =>
    userAudiences.includes(a.slug)
  );

  const availabilityScore =
    availability === "ongoing"
      ? 5
      : availability === "upcoming"
      ? 2
      : availability === "ended"
      ? 1
      : 0;
  const audienceScore = matchesAudience ? 10 : 0;
  return availabilityScore + audienceScore;
};

export const sortEnrollmentsByScoreFn =
  (userAudiences: string[]) => (a: CourseEnrollment, b: CourseEnrollment) =>
    scoreEnrollment(b, userAudiences) - scoreEnrollment(a, userAudiences);
