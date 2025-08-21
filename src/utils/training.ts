import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { CourseEnrollment, TrainingSection } from "../types/entities";
import {
  FeaturedWindow,
  RelativeEnrollmentDto,
  SectionAndWindow,
  SectionAndWindowWithRelativeAvailability,
  TrainingAvailability,
} from "../types/training";
import { orderSort } from "./core";

dayjs.extend(duration);

function* buildSectionFeaturedWindows(
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
): IterableIterator<SectionAndWindowWithRelativeAvailability> {
  if (!enrollment) {
    return;
  }

  let lastEnd = dayjs(enrollment.startDate);
  const enrollmentEnd = enrollment.endDate ? dayjs(enrollment.endDate) : null;

  for (const section of sections.slice().sort(orderSort)) {
    const nextEnd = lastEnd.add(dayjs.duration(section.duration));

    if (enrollmentEnd !== null && nextEnd.isAfter(enrollmentEnd)) {
      break;
    }

    const window: FeaturedWindow = {
      featuredOn: lastEnd,
      featuredUntil: nextEnd.subtract(1),
    };

    const relativeAvailability = getCourseAvailability(
      window.featuredOn,
      window.featuredUntil
    );

    yield {
      window: {
        featuredOn: lastEnd,
        featuredUntil: nextEnd.subtract(1),
      },
      section,
      relativeAvailability,
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

/** Return the section and window that is either currently available or next available. */
export const getNextAvailableSection = (
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
): Partial<SectionAndWindow> => {
  const firstSectionAndWindow: Partial<SectionAndWindow> = {};

  for (const { window, section } of buildSectionFeaturedWindows(
    enrollment,
    sections
  )) {
    // Store first section and window as default.
    if (!firstSectionAndWindow.section) {
      firstSectionAndWindow.section = section;
      firstSectionAndWindow.window = window;
    }

    if (window && isInFeaturedWindow(window)) {
      return { section, window };
    }
  }

  return firstSectionAndWindow;
};

/** Return the section and window that is either currently available or most recently available. */
export const getLatestAvailableSectionWithPreviousAndNext = (
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
) => {
  let previousToLatest: SectionAndWindowWithRelativeAvailability | null = null;
  let latest: SectionAndWindowWithRelativeAvailability | null = null;
  let nextAfterLatest: SectionAndWindowWithRelativeAvailability | null = null;

  for (const result of buildSectionFeaturedWindows(enrollment, sections)) {
    // Store first section and window as default.
    if (
      result.relativeAvailability === "ended" ||
      result.relativeAvailability === "ongoing"
    ) {
      latest = result;
      previousToLatest = latest;
    } else if (result.relativeAvailability === "upcoming") {
      if (latest === null) {
        latest = result;
      } else {
        nextAfterLatest = result;
        break;
      }
    }
  }

  return {
    previous: previousToLatest,
    latest: latest,
    next: nextAfterLatest,
  };
};

export const getLatestAvailableSection = (
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
): SectionAndWindow | null => {
  return getLatestAvailableSectionWithPreviousAndNext(enrollment, sections)
    .latest;
};

export const getSectionFeaturedWindows = (
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
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

export const getSectionAndWindowBySectionIdWithPreviousAndNext = (
  sectionId: string,
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
) => {
  let previousSectionAndWindow: SectionAndWindow | null = null;
  let matchingSectionAndWindow: SectionAndWindow | null = null;
  let nextSectionAndWindow: SectionAndWindow | null = null;

  for (const { window, section } of buildSectionFeaturedWindows(
    enrollment,
    sections
  )) {
    if (section.id === sectionId) {
      matchingSectionAndWindow = { section, window };
    } else if (matchingSectionAndWindow === null) {
      previousSectionAndWindow = { section, window };
    } else {
      nextSectionAndWindow = { section, window };
      break;
    }
  }

  return {
    previous: previousSectionAndWindow,
    matching: matchingSectionAndWindow,
    next: nextSectionAndWindow,
  };
};

export const getSectionAndWindowBySectionId = (
  sectionId: string,
  enrollment: CourseEnrollment | RelativeEnrollmentDto | undefined,
  sections: TrainingSection[]
): SectionAndWindow | null => {
  return getSectionAndWindowBySectionIdWithPreviousAndNext(
    sectionId,
    enrollment,
    sections
  ).matching;
};

export function getCourseAvailability(
  startDate: null | undefined,
  endDate: string | null | undefined | Date | Dayjs
): null;
export function getCourseAvailability(
  startDate: string | Date | Dayjs,
  endDate: string | null | undefined | Date | Dayjs
): TrainingAvailability;
export function getCourseAvailability(
  startDate: string | null | undefined | Date | Dayjs,
  endDate: string | null | undefined | Date | Dayjs
): TrainingAvailability | null;
export function getCourseAvailability(
  startDate: string | null | undefined | Date | Dayjs,
  endDate: string | null | undefined | Date | Dayjs
): TrainingAvailability | null {
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
}

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
