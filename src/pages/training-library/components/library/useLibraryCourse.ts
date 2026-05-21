import { useContext, useMemo } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { DEFAULT_THUMBNAIL_URL } from "../../../../constants/core";
import { TrainingContext } from "../../../../contexts/training/training-context";
import {
  CourseEnrollment,
  TrainingCourse,
  TrainingSection,
} from "../../../../types/entities";
import { FeaturedWindow } from "../../../../types/training";
import { orderSort } from "../../../../utils/core";
import {
  getCourseAvailability,
  getNextAvailableSection,
  getSectionFeaturedWindows,
} from "../../../../utils/training";

dayjs.extend(duration);

/**
 * Status of a section within the guided program:
 *  - done:      every item is complete
 *  - current:   the section the user should be in this month
 *  - available: a past/open section, not finished (catch-up)
 *  - upcoming:  a future section — still openable, just not featured yet
 */
export type SectionStatus = "done" | "current" | "available" | "upcoming";

export interface SectionRow {
  id: string;
  section: TrainingSection;
  window: FeaturedWindow | null;
  status: SectionStatus;
  index: number;
  itemCount: number;
  completedItems: number;
  /** 0..1 completion across the section's items. */
  fraction: number;
  isComplete: boolean;
  isSingleItem: boolean;
  title: string;
  description: string;
  thumbnailUrl: string;
  to: string;
}

export interface LibraryCourse {
  rows: SectionRow[];
  /** The one section to spotlight: current, else first unfinished, else first. */
  focused: SectionRow | null;
  completeCount: number;
  totalCount: number;
}

/** Section/course titles are authored in a rich-text editor; strip markup
 * so they render cleanly as plain single-line text. */
export const stripHtml = (html?: string | null): string =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Render a featured window as a compact date range, or "" when unknown. */
export const formatWindow = (window: FeaturedWindow | null): string => {
  if (!window) return "";
  const { featuredOn: a, featuredUntil: b } = window;
  if (!a?.isValid?.() || !b?.isValid?.()) return "";
  if (a.isSame(b, "month")) return `${a.format("MMM D")}–${b.format("D")}`;
  if (a.isSame(b, "year")) return `${a.format("MMM D")} – ${b.format("MMM D")}`;
  return `${a.format("MMM D, YYYY")} – ${b.format("MMM D, YYYY")}`;
};

/**
 * Derives the end-user view of a training course: an ordered list of
 * sections with per-section status + completion, plus the single section
 * to spotlight. Completion is read from the active enrollment's item
 * completions in TrainingContext.
 */
export const useLibraryCourse = (
  course: TrainingCourse | undefined | null,
  enrollment: CourseEnrollment | undefined | null,
): LibraryCourse => {
  const { state } = useContext(TrainingContext);
  const completions = state.itemCompletionsMap;

  return useMemo(() => {
    const allSections = (course?.sections ?? []).slice().sort(orderSort);
    if (allSections.length === 0) {
      return { rows: [], focused: null, completeCount: 0, totalCount: 0 };
    }

    // Featured windows need an enrollment with a start date. When that's
    // absent the map is simply empty and every section reads as available.
    const windowBySection = new Map<string, FeaturedWindow>();
    for (const { section, window } of getSectionFeaturedWindows(
      enrollment ?? undefined,
      allSections,
    )) {
      if (section?.id) windowBySection.set(section.id, window);
    }

    const focusedId = getNextAvailableSection(
      enrollment ?? undefined,
      allSections,
    ).section?.id;

    const rows: SectionRow[] = allSections.map((section, index) => {
      const items = section.items ?? [];
      const itemIds = items
        .map((si) => si?.item?.id)
        .filter((id): id is string => !!id);
      const completedItems = itemIds.filter(
        (id) => completions?.get(id)?.completed,
      ).length;
      const itemCount = itemIds.length;
      const isComplete = itemCount > 0 && completedItems === itemCount;
      const fraction = itemCount > 0 ? completedItems / itemCount : 0;

      const window = (section.id && windowBySection.get(section.id)) || null;
      const availability = window
        ? getCourseAvailability(window.featuredOn, window.featuredUntil)
        : null;

      let status: SectionStatus;
      if (isComplete) status = "done";
      else if (section.id && section.id === focusedId) status = "current";
      else if (availability === "upcoming") status = "upcoming";
      else status = "available";

      const isSingleItem = items.length === 1;
      const firstItem = items[0]?.item;
      const rawTitle = isSingleItem
        ? (firstItem?.metadata?.title ?? section.metadata?.title)
        : section.metadata?.title;
      const rawDesc = isSingleItem
        ? (firstItem?.metadata?.description ?? section.metadata?.description)
        : section.metadata?.description;

      return {
        id: section.id,
        section,
        window,
        status,
        index,
        itemCount,
        completedItems,
        fraction,
        isComplete,
        isSingleItem,
        title: stripHtml(rawTitle) || "Untitled section",
        description: stripHtml(rawDesc),
        thumbnailUrl: firstItem?.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL,
        to: `/training/library/sections/${section.id}`,
      };
    });

    const focused =
      rows.find((r) => r.status === "current") ??
      rows.find((r) => !r.isComplete) ??
      rows[0] ??
      null;

    return {
      rows,
      focused,
      completeCount: rows.filter((r) => r.isComplete).length,
      totalCount: rows.length,
    };
  }, [course, enrollment, completions]);
};
