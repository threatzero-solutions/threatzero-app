import { useContext, useMemo } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
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
dayjs.extend(relativeTime);

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
  /**
   * 0..1 overall watch progress across the section's items, counting
   * partial video progress (not just fully-completed items). This is what
   * surfaces "halfway through" at a glance.
   */
  watchProgress: number;
  isComplete: boolean;
  /**
   * In practice nearly every section holds exactly one item, so a section
   * effectively *is* that item. When true, treat and label it as a single
   * piece of training, not a "section".
   */
  isSingleItem: boolean;
  /** Humanized total estimated time across the section's items, if known. */
  estTimeLabel: string | null;
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
 * sections with per-section status, completion, watch progress, and
 * estimated time, plus the single section to spotlight. Completion is read
 * from the active enrollment's item completions in TrainingContext.
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

      let itemCount = 0;
      let completedItems = 0;
      let progressSum = 0;
      let estTotal = dayjs.duration(0);
      let hasEst = false;

      for (const si of items) {
        const itemId = si?.item?.id;
        if (!itemId) continue;
        itemCount += 1;

        const completion = completions?.get(itemId);
        if (completion?.completed) {
          completedItems += 1;
          progressSum += 1;
        } else {
          progressSum += completion?.progress ?? 0;
        }

        const est = si?.item?.estCompletionTime;
        if (est) {
          estTotal = estTotal.add(dayjs.duration(est));
          hasEst = true;
        }
      }

      const isComplete = itemCount > 0 && completedItems === itemCount;
      const watchProgress = itemCount > 0 ? progressSum / itemCount : 0;
      const estTimeLabel =
        hasEst && estTotal.asSeconds() >= 1 ? estTotal.humanize() : null;

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
        watchProgress,
        isComplete,
        isSingleItem,
        estTimeLabel,
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
