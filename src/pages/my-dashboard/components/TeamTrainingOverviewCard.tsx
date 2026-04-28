import { useContext, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { TrainingContext } from "../../../contexts/training/training-context";
import { useMe } from "../../../contexts/me/MeProvider";
import { getSectionFeaturedWindows } from "../../../utils/training";
import { getItemCompletionsSummary } from "../../../queries/training";
import { DEFAULT_THUMBNAIL_URL } from "../../../constants/core";
import type { TrainingSection } from "../../../types/entities";
import type { FeaturedWindow } from "../../../types/training";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type State = "current" | "past";

interface Entry {
  section: TrainingSection;
  window: FeaturedWindow;
  state: State;
}

interface Summary {
  totalComplete: number;
  totalIncomplete: number;
}

const classify = (window: FeaturedWindow, today: Dayjs): State | null => {
  if (
    today.isSameOrAfter(window.featuredOn, "day") &&
    today.isSameOrBefore(window.featuredUntil, "day")
  ) {
    return "current";
  }
  if (today.isAfter(window.featuredUntil, "day")) return "past";
  return null; // future — skip for team overview
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

// Matches TrainingSectionTile: a single-item section hoists the item's title.
const sectionDisplayTitle = (section: TrainingSection) => {
  const items = section.items ?? [];
  const firstItem = items[0]?.item;
  const raw =
    items.length === 1
      ? (firstItem?.metadata?.title ?? section.metadata?.title)
      : section.metadata?.title;
  return (raw ?? "Untitled training").replace(/<[^>]*>/g, "").trim();
};

const sectionThumb = (section: TrainingSection) =>
  section.items?.[0]?.item?.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL;

/**
 * Pick the sections a training admin cares about right now:
 * - the current featured section (emphasized)
 * - up to the two most recent past sections (deemphasized)
 *
 * Future sections are skipped — nothing meaningful to report until they open.
 */
const pickRecent = (entries: Entry[]): Entry[] => {
  const pastAndCurrent = entries.filter(
    (e) => e.state === "current" || e.state === "past",
  );
  const currentIdx = pastAndCurrent.findIndex((e) => e.state === "current");
  if (currentIdx >= 0) {
    const start = Math.max(0, currentIdx - 2);
    return pastAndCurrent.slice(start, currentIdx + 1);
  }
  // No current section — show the three most recent past.
  return pastAndCurrent.slice(Math.max(0, pastAndCurrent.length - 3));
};

const TeamTrainingOverviewCard: React.FC = () => {
  const { state, courseLoading } = useContext(TrainingContext);
  const { me, labels } = useMe();

  const entries = useMemo<Entry[]>(() => {
    const today = dayjs();
    const windows = getSectionFeaturedWindows(
      state.activeEnrollment,
      state.activeCourse?.sections ?? [],
    );
    const out: Entry[] = [];
    for (const w of windows) {
      const s = classify(w.window, today);
      if (s) out.push({ section: w.section, window: w.window, state: s });
    }
    return out;
  }, [state.activeEnrollment, state.activeCourse]);

  const visible = useMemo(() => pickRecent(entries), [entries]);

  // Per-section completion stats scoped to: the user's org + active
  // enrollment + exactly this section's item IDs. Mirrors the query shape
  // used by ViewWatchStats (`src/pages/safety-management/training-admin`) —
  // which is the only place in the app currently consuming this endpoint.
  // The organization filter also triggers the backend's
  // populateEmptyItemCompletionsForUsers side-effect so fresh users show up.
  const enrollmentId = state.activeEnrollment?.id;
  const organizationId = me?.organization?.id;

  const summaries = useQueries({
    queries: visible.map((e) => {
      const itemIds = (e.section.items ?? [])
        .map((i) => i?.item?.id)
        .filter((id): id is string => !!id);
      const canQuery = !!enrollmentId && itemIds.length > 0;
      return {
        queryKey: [
          "training-completions-summary",
          {
            organizationId,
            enrollmentId,
            itemIds,
          },
        ] as const,
        queryFn: () =>
          getItemCompletionsSummary({
            ...(organizationId
              ? { "user.organization.id": organizationId }
              : {}),
            "enrollment.id": enrollmentId!,
            "item.id": itemIds,
          }) as unknown as Promise<Summary>,
        enabled: canQuery,
      };
    }),
  });

  const header = (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold text-gray-900">
        {labels.teamSingular} training overview
      </h2>
      <Link
        to="/safety-management/training-admin"
        className="text-xs font-medium text-secondary-700 hover:text-secondary-800 hover:underline"
      >
        View completions &rarr;
      </Link>
    </div>
  );

  const courseTitle = state.activeCourse?.metadata?.title
    ? state.activeCourse.metadata.title.replace(/<[^>]*>/g, "").trim()
    : null;

  if (courseLoading) {
    return (
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        {header}
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (visible.length === 0) {
    return (
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        {header}
        <div className="text-sm text-gray-500">
          No current or recent training to report on.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      {header}

      {courseTitle && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {courseTitle}
        </p>
      )}

      <ul className="space-y-2">
        {visible.map((entry, i) => (
          <OverviewRow
            key={entry.section.id}
            entry={entry}
            summary={summaries[i]?.data}
            loading={summaries[i]?.isPending ?? true}
          />
        ))}
      </ul>
    </section>
  );
};

interface RowProps {
  entry: Entry;
  summary?: Summary;
  loading: boolean;
}

const OverviewRow: React.FC<RowProps> = ({ entry, summary, loading }) => {
  const { section, window, state } = entry;

  const completed = summary?.totalComplete ?? 0;
  const incomplete = summary?.totalIncomplete ?? 0;
  const total = completed + incomplete;
  const percent = total > 0 ? completed / total : 0;

  const rowBg =
    state === "current"
      ? "border-primary-300 bg-primary-50"
      : "border-gray-200 bg-white";
  const titleClass =
    state === "current"
      ? "text-gray-900 font-semibold"
      : "text-gray-600 font-medium";
  const metaClass = state === "current" ? "text-primary-700" : "text-gray-400";
  const barBg = state === "current" ? "bg-primary-500" : "bg-gray-400";
  const pctClass = state === "current" ? "text-primary-700" : "text-gray-500";

  return (
    <li>
      <div
        className={`grid grid-cols-[80px_minmax(0,1fr)_200px] items-center gap-4 rounded-lg border px-3 py-2.5 ${rowBg}`}
      >
        <div
          aria-hidden
          className={`h-12 w-20 overflow-hidden rounded-md bg-gray-200 ${state === "past" ? "opacity-80" : ""}`}
        >
          <img
            src={sectionThumb(section)}
            alt=""
            className={`h-full w-full object-cover ${state === "past" ? "grayscale" : ""}`}
          />
        </div>

        <div className="min-w-0">
          <div className={`truncate text-sm ${titleClass}`}>
            {sectionDisplayTitle(section)}
          </div>
          <div className={`mt-0.5 truncate text-xs ${metaClass}`}>
            {formatRange(window)}
            {state === "current" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Now
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
        ) : total === 0 ? (
          <div className="text-right text-xs text-gray-400">No enrollees</div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${barBg}`}
                style={{ width: `${percent * 100}%` }}
              />
            </div>
            <span className="flex shrink-0 items-baseline gap-1 text-xs tabular-nums">
              <strong className="font-bold text-gray-900">{completed}</strong>
              <span className="text-gray-400">/{total}</span>
              <span className={`ml-1 w-8 text-right font-semibold ${pctClass}`}>
                {Math.round(percent * 100)}%
              </span>
            </span>
          </div>
        )}
      </div>
    </li>
  );
};

export default TeamTrainingOverviewCard;
