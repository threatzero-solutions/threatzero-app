import { useContext, useMemo } from "react";
import { Link, useLocation } from "react-router";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { TrainingContext } from "../../../contexts/training/training-context";
import { getSectionFeaturedWindows } from "../../../utils/training";
import { DEFAULT_THUMBNAIL_URL } from "../../../constants/core";
import type { ItemCompletion, TrainingSection } from "../../../types/entities";
import type { FeaturedWindow } from "../../../types/training";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type State = "past" | "current" | "future";

interface Entry {
  section: TrainingSection;
  window: FeaturedWindow;
  state: State;
}

type CompletionsMap = Map<string, ItemCompletion> | undefined;

const classify = (window: FeaturedWindow, today: Dayjs): State => {
  if (
    today.isSameOrAfter(window.featuredOn, "day") &&
    today.isSameOrBefore(window.featuredUntil, "day")
  ) {
    return "current";
  }
  return today.isAfter(window.featuredUntil, "day") ? "past" : "future";
};

const formatRange = (w: FeaturedWindow) => {
  const sameMonth = w.featuredOn.isSame(w.featuredUntil, "month");
  const sameYear = w.featuredOn.isSame(w.featuredUntil, "year");
  if (sameMonth)
    return `${w.featuredOn.format("MMM D")}–${w.featuredUntil.format("D")}`;
  if (sameYear)
    return `${w.featuredOn.format("MMM D")} – ${w.featuredUntil.format("MMM D")}`;
  return `${w.featuredOn.format("MMM D, YYYY")} – ${w.featuredUntil.format("MMM D, YYYY")}`;
};

// Single-item sections hoist the item's title/description (see
// TrainingSectionTile in the library view).
const hoistField = (
  section: TrainingSection,
  field: "title" | "description",
) => {
  const items = section.items ?? [];
  const firstItem = items[0]?.item;
  const raw =
    items.length === 1
      ? (firstItem?.metadata?.[field] ?? section.metadata?.[field])
      : section.metadata?.[field];
  return (raw ?? "").replace(/<[^>]*>/g, "").trim();
};

const sectionTitle = (section: TrainingSection) =>
  hoistField(section, "title") || "Untitled training";

const sectionDescription = (section: TrainingSection) =>
  hoistField(section, "description");

const sectionThumb = (section: TrainingSection) =>
  section.items?.[0]?.item?.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL;

/**
 * Roll a section's item-level completions up into a single display state.
 *
 * Mirrors the library's TrainingSectionTile pattern (sum completions across
 * the section's items), but returns an explicit UI-usable shape instead of
 * the VideoProgress "duration/currentTime" kludge so rows can pick the
 * right label at a glance.
 */
interface SectionProgress {
  total: number;
  completed: number;
  /** Average progress across items in the section (0–1). */
  avgProgress: number;
}
const summarizeSection = (
  section: TrainingSection,
  map: CompletionsMap,
): SectionProgress => {
  const items = section.items ?? [];
  if (items.length === 0 || !map) {
    return { total: items.length, completed: 0, avgProgress: 0 };
  }
  let completed = 0;
  let progressSum = 0;
  for (const it of items) {
    if (!it?.item) continue;
    const c = map.get(it.item.id);
    if (c?.completed) completed++;
    progressSum += c?.progress ?? 0;
  }
  return {
    total: items.length,
    completed,
    avgProgress: items.length > 0 ? progressSum / items.length : 0,
  };
};

const pickSchedule = (entries: Entry[]): Entry[] => {
  if (entries.length <= 4) return entries;
  const currentIdx = entries.findIndex((e) => e.state === "current");
  if (currentIdx >= 0) {
    const start = Math.max(0, currentIdx - 1);
    return entries.slice(start, start + 4);
  }
  const firstFutureIdx = entries.findIndex((e) => e.state === "future");
  if (firstFutureIdx >= 0) {
    const start = Math.max(0, firstFutureIdx - 2);
    return entries.slice(start, start + 4);
  }
  return entries.slice(Math.max(0, entries.length - 4));
};

const MyTraining: React.FC = () => {
  const { state, courseLoading } = useContext(TrainingContext);
  const location = useLocation();

  const entries = useMemo<Entry[]>(() => {
    const today = dayjs();
    const windows = getSectionFeaturedWindows(
      state.activeEnrollment,
      state.activeCourse?.sections ?? [],
    );
    return windows.map((w) => ({
      section: w.section,
      window: w.window,
      state: classify(w.window, today),
    }));
  }, [state.activeEnrollment, state.activeCourse]);

  const visible = useMemo(() => pickSchedule(entries), [entries]);

  const featured = useMemo<Entry | null>(() => {
    return (
      entries.find((e) => e.state === "current") ??
      entries.find((e) => e.state === "future") ??
      null
    );
  }, [entries]);

  const header = (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold text-gray-900">My training</h2>
      <Link
        to="/training/library"
        state={{ from: location }}
        className="text-xs font-medium text-secondary-700 transition-colors hover:text-secondary-800 hover:underline"
      >
        View all training &rarr;
      </Link>
    </div>
  );

  const shell = (children: React.ReactNode) => (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      {header}
      {children}
    </section>
  );

  if (courseLoading) {
    return shell(
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-gray-100"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
      </div>,
    );
  }

  if (visible.length === 0 || !featured) {
    return shell(
      <p className="text-sm text-gray-500">No training scheduled yet.</p>,
    );
  }

  return shell(
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
      <ul className="-mx-2 divide-y divide-gray-100">
        {visible.map((entry) => (
          <ScheduleRow
            key={entry.section.id}
            {...entry}
            completionsMap={state.itemCompletionsMap}
          />
        ))}
      </ul>

      <FeaturedPanel
        entry={featured}
        completionsMap={state.itemCompletionsMap}
      />
    </div>,
  );
};

interface RowProps {
  section: TrainingSection;
  window: FeaturedWindow;
  state: State;
  completionsMap: CompletionsMap;
}

/**
 * Turn (state, progress) into the row's right-side status tag.
 * Prioritizes completion signal over time-state so "Watched" wins over "Now".
 */
const statusTag = (
  state: State,
  window: FeaturedWindow,
  p: SectionProgress,
) => {
  const fullyWatched = p.total > 0 && p.completed === p.total;
  const partiallyWatched = p.completed > 0 && p.completed < p.total;
  const inProgress = p.avgProgress > 0 && p.completed === 0;

  if (fullyWatched) {
    return {
      label: "Watched",
      icon: CheckCircleIcon,
      className: "text-primary-600",
    };
  }
  if (partiallyWatched) {
    return {
      label: `${p.completed}/${p.total} watched`,
      icon: null,
      className: "text-primary-600",
    };
  }
  if (inProgress) {
    return {
      label: `${Math.round(p.avgProgress * 100)}% watched`,
      icon: null,
      className: state === "current" ? "text-primary-700" : "text-gray-500",
    };
  }
  if (state === "current") {
    return {
      label: "Not started",
      icon: null,
      className: "text-primary-700 font-semibold",
    };
  }
  if (state === "past") {
    return {
      label: "Not watched",
      icon: null,
      className: "text-gray-400",
    };
  }
  return {
    label: `Starts ${window.featuredOn.format("MMM D")}`,
    icon: null,
    className: "text-gray-400",
  };
};

const ScheduleRow: React.FC<RowProps> = ({
  section,
  window,
  state,
  completionsMap,
}) => {
  const location = useLocation();
  const title = sectionTitle(section);
  const range = formatRange(window);
  const progress = summarizeSection(section, completionsMap);
  const tag = statusTag(state, window, progress);

  const rowTone = {
    past: "hover:bg-gray-50",
    current: "bg-primary-50/60 hover:bg-primary-50",
    future: "hover:bg-gray-50",
  }[state];

  const titleClass = {
    past: "text-gray-700",
    current: "text-gray-900",
    future: "text-gray-500",
  }[state];

  const metaClass = {
    past: "text-gray-500",
    current: "text-primary-700",
    future: "text-gray-400",
  }[state];

  const Icon = tag.icon;

  return (
    <li className="list-none">
      <Link
        to={`/training/library/sections/${section.id}`}
        state={{ from: location }}
        className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${rowTone}`}
      >
        <div className="min-w-0 flex-1">
          <div className={`truncate text-sm font-semibold ${titleClass}`}>
            {title}
          </div>
          <div className={`mt-0.5 truncate text-xs ${metaClass}`}>{range}</div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${tag.className}`}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {tag.label}
        </span>
      </Link>
    </li>
  );
};

const FeaturedPanel: React.FC<{
  entry: Entry;
  completionsMap: CompletionsMap;
}> = ({ entry, completionsMap }) => {
  const location = useLocation();
  const { section, window, state } = entry;
  const title = sectionTitle(section);
  const description = sectionDescription(section);
  const thumb = sectionThumb(section);
  const range = formatRange(window);
  const progress = summarizeSection(section, completionsMap);

  const isWatchable = state === "current" || state === "past";
  const fullyWatched =
    progress.total > 0 && progress.completed === progress.total;
  const hasAnyProgress = progress.avgProgress > 0 || progress.completed > 0;

  const ctaLabel = fullyWatched
    ? "Rewatch"
    : hasAnyProgress
      ? "Continue"
      : isWatchable
        ? "Watch now"
        : "Preview";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
        <img
          src={thumb}
          alt=""
          className={`h-full w-full object-cover ${state === "future" ? "opacity-70" : ""}`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-gray-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">{range}</p>
        </div>
        {description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">
            {description}
          </p>
        )}
        {hasAnyProgress && !fullyWatched && (
          <div className="relative h-1 overflow-hidden rounded-full bg-gray-200">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary-500"
              style={{ width: `${progress.avgProgress * 100}%` }}
            />
          </div>
        )}
        <Link
          to={`/training/library/sections/${section.id}`}
          state={{ from: location }}
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
            isWatchable
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
          }`}
        >
          {isWatchable ? (
            <>
              <PlayCircleIcon className="h-4 w-4" />
              {ctaLabel}
            </>
          ) : (
            <>
              {ctaLabel}
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MyTraining;
