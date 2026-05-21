import { Link, useLocation } from "react-router";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/20/solid";
import { cn } from "../../../../utils/core";
import VideoProgress from "../VideoProgress";
import { formatWindow, type SectionRow } from "./useLibraryCourse";

interface CourseSectionsProps {
  rows: SectionRow[];
  completeCount: number;
  totalCount: number;
}

/** The status disc on the timeline rail. Always a block so it sizes
 * predictably and sits cleanly on top of the connecting line. */
const StatusNode: React.FC<{ status: SectionRow["status"] }> = ({ status }) => {
  if (status === "done") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-600 text-white">
        <CheckIcon aria-hidden className="h-4 w-4" />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-primary-500 bg-white">
        <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="block h-7 w-7 rounded-full border-2 border-dashed border-gray-300 bg-white" />
    );
  }
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-gray-300 bg-white">
      <span className="h-2 w-2 rounded-full bg-gray-300" />
    </span>
  );
};

/** Trailing status / progress indicator on the right of a section row. */
const RowTrailing: React.FC<{ row: SectionRow }> = ({ row }) => {
  if (row.isComplete) {
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-success-700">
        Done
      </span>
    );
  }
  if (row.status === "upcoming") {
    const opens = row.window?.featuredOn;
    return (
      <span className="text-xs font-medium text-secondary-400">
        {opens?.isValid?.() ? `Opens ${opens.format("MMM D")}` : "Upcoming"}
      </span>
    );
  }
  if (row.watchProgress > 0) {
    return (
      <VideoProgress
        duration={1}
        currentTime={row.watchProgress}
        className="h-8 w-8"
      />
    );
  }
  return (
    <ArrowRightIcon
      aria-hidden
      className="h-5 w-5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500"
    />
  );
};

const SectionRowItem: React.FC<{ row: SectionRow; isLast: boolean }> = ({
  row,
  isLast,
}) => {
  const location = useLocation();

  const meta = [
    formatWindow(row.window),
    row.estTimeLabel,
    row.itemCount > 1 ? `${row.itemCount} items` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <li className="relative pb-2.5 last:pb-0">
      {/* Continuous rail: a single line that runs from this node down
          through the row gap into the next node, which caps it. */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[0.875rem] top-3 h-full w-px -translate-x-1/2 bg-gray-200"
        />
      )}

      <div className="flex items-start gap-3">
        <div className="relative z-10 mt-3 shrink-0">
          <StatusNode status={row.status} />
        </div>

        <Link
          to={row.to}
          state={{ from: location }}
          className={cn(
            "group grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 transition-all",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
            row.status === "current"
              ? "border-primary-300 bg-primary-50/60 hover:border-primary-400 hover:shadow-sm"
              : row.status === "upcoming"
                ? "border-gray-200 bg-warm-50 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm",
          )}
        >
          <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-gray-200">
            <img
              src={row.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className={cn(
                "h-full w-full object-cover",
                row.status === "upcoming" && "opacity-60",
              )}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-sm font-semibold",
                  row.status === "upcoming"
                    ? "text-secondary-600"
                    : "text-secondary-900",
                )}
              >
                {row.title}
              </span>
              {row.status === "current" && (
                <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
                  Current
                </span>
              )}
            </div>
            {meta && (
              <p className="mt-0.5 truncate text-xs text-secondary-500">
                {meta}
              </p>
            )}
          </div>

          <RowTrailing row={row} />
        </Link>
      </div>
    </li>
  );
};

/**
 * The full course as a vertical timeline: one row per section in program
 * order, each carrying its own status, watch progress, and estimated time.
 * A course-level progress bar sits above.
 */
const CourseSections: React.FC<CourseSectionsProps> = ({
  rows,
  completeCount,
  totalCount,
}) => {
  const pct = totalCount > 0 ? (completeCount / totalCount) * 100 : 0;

  return (
    <section className="mt-8" aria-labelledby="course-sections-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="course-sections-heading"
          className="text-lg font-semibold text-secondary-900"
        >
          Course sections
        </h2>
        <span className="text-sm font-medium text-secondary-500">
          <span className="font-semibold tabular-nums text-secondary-700">
            {completeCount}
          </span>{" "}
          of {totalCount} complete
        </span>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <span
          className="block h-full rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-5">
        {rows.map((row, i) => (
          <SectionRowItem
            key={row.id}
            row={row}
            isLast={i === rows.length - 1}
          />
        ))}
      </ol>
    </section>
  );
};

export default CourseSections;
