import dayjs, { Dayjs } from "dayjs";
import { CourseEnrollment, TrainingSection } from "../types/entities";
import {
  FeaturedWindow,
  SectionAndWindow,
  TrainingAvailability,
} from "../types/training";
import { orderSort } from "./core";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

function* buildSectionFeaturedWindows(
  enrollment: CourseEnrollment | undefined,
  sections: TrainingSection[]
): IterableIterator<SectionAndWindow> {
  if (!enrollment) {
    return;
  }

  let lastEnd = dayjs(enrollment.startDate);
  for (const section of sections.sort(orderSort)) {
    const nextEnd = lastEnd.add(dayjs.duration(section.duration));

    yield {
      window: {
        featuredOn: lastEnd,
        featuredUntil: nextEnd.subtract(1),
      },
      section,
    };

    lastEnd = nextEnd;
  }
}

const isInFeaturedWindow = (window: FeaturedWindow, today?: Dayjs) => {
  today = today || dayjs();
  return (
    (today.isSame(window.featuredOn, "day") ||
      today.isAfter(window.featuredOn, "day")) &&
    (today.isBefore(window.featuredUntil, "day") ||
      today.isSame(window.featuredUntil, "day"))
  );
};

export const getNextAvailableSection = (
  enrollment: CourseEnrollment | undefined,
  sections: TrainingSection[]
): Partial<SectionAndWindow> => {
  for (const { window, section } of buildSectionFeaturedWindows(
    enrollment,
    sections
  )) {
    if (window && isInFeaturedWindow(window)) {
      return { window, section };
    }
  }

  return { section: sections[0], window: null };
};

export const getSectionFeaturedWindows = (
  enrollment: CourseEnrollment | undefined,
  sections: TrainingSection[]
) => {
  const featuredWindows = new Map<TrainingSection["id"], SectionAndWindow>();

  for (const { window, section } of buildSectionFeaturedWindows(
    enrollment,
    sections
  )) {
    if (!section) {
      continue;
    }
    featuredWindows.set(section.id, { section, window });
  }

  return featuredWindows;
};

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
