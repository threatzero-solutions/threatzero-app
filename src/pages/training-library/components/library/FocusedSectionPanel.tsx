import { Link, useLocation } from "react-router";
import { ArrowRightIcon, PlayIcon } from "@heroicons/react/20/solid";
import { cn } from "../../../../utils/core";
import { formatWindow, type SectionRow } from "./useLibraryCourse";

interface FocusedSectionPanelProps {
  row: SectionRow;
}

/**
 * The spotlight at the top of the library: the one piece of training the
 * user should act on next. Sections almost always hold a single item, so
 * a one-item section is presented simply as "training", not as a section.
 */
const FocusedSectionPanel: React.FC<FocusedSectionPanelProps> = ({ row }) => {
  const location = useLocation();

  const noun = row.isSingleItem ? "training" : "section";
  const started = row.watchProgress > 0 && !row.isComplete;

  const eyebrow = row.isComplete
    ? "Completed"
    : row.status === "upcoming"
      ? "Up next"
      : started
        ? "In progress"
        : "Start here";

  const eyebrowClass = row.isComplete
    ? "text-success-700"
    : row.status === "upcoming"
      ? "text-secondary-500"
      : "text-primary-700";

  const cta = row.isComplete
    ? `Review ${noun}`
    : row.status === "upcoming"
      ? `Preview ${noun}`
      : started
        ? "Continue"
        : `Start ${noun}`;

  const meta = [
    formatWindow(row.window),
    row.estTimeLabel,
    !row.isSingleItem && row.itemCount > 1 ? `${row.itemCount} items` : null,
  ].filter(Boolean);

  const progressLabel = row.isSingleItem
    ? `${Math.round(row.watchProgress * 100)}% watched`
    : `${row.completedItems} of ${row.itemCount} complete`;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4 p-6">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                eyebrowClass,
              )}
            >
              {eyebrow}
            </p>
            <h2 className="mt-1.5 text-2xl font-bold leading-tight text-secondary-900">
              {row.title}
            </h2>
          </div>

          {row.description && (
            <p className="line-clamp-2 max-w-prose text-sm leading-relaxed text-secondary-600">
              {row.description}
            </p>
          )}

          {meta.length > 0 && (
            <p className="text-xs font-medium text-secondary-500">
              {meta.join("  ·  ")}
            </p>
          )}

          {started && (
            <div className="max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <span
                  className="block h-full rounded-full bg-primary-500"
                  style={{ width: `${row.watchProgress * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs font-medium text-secondary-500">
                {progressLabel}
              </p>
            </div>
          )}

          <div>
            <Link
              to={row.to}
              state={{ from: location }}
              className="group inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <PlayIcon aria-hidden className="h-4 w-4" />
              {cta}
              <ArrowRightIcon
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        <div className="relative order-first aspect-video bg-gray-200 sm:order-last sm:aspect-auto">
          <img
            src={row.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default FocusedSectionPanel;
