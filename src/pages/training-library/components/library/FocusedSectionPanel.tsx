import { Link, useLocation } from "react-router";
import { ArrowRightIcon, PlayIcon } from "@heroicons/react/20/solid";
import { cn } from "../../../../utils/core";
import { formatWindow, type SectionRow } from "./useLibraryCourse";

interface FocusedSectionPanelProps {
  row: SectionRow;
}

/**
 * The spotlight at the top of the library: the one section the user
 * should act on next. A wide panel — thumbnail beside a clear eyebrow,
 * title, blurb, progress, and a single primary action.
 */
const FocusedSectionPanel: React.FC<FocusedSectionPanelProps> = ({ row }) => {
  const location = useLocation();

  const started = row.completedItems > 0 && !row.isComplete;

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
    ? "Review section"
    : row.status === "upcoming"
      ? "Preview section"
      : started
        ? "Continue"
        : "Start section";

  const dateRange = formatWindow(row.window);
  const meta = [
    dateRange,
    row.itemCount > 0
      ? `${row.itemCount} ${row.itemCount === 1 ? "item" : "items"}`
      : null,
  ].filter(Boolean);

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

          {started && row.itemCount > 1 && (
            <div className="max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <span
                  className="block h-full rounded-full bg-primary-500"
                  style={{ width: `${row.fraction * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs font-medium text-secondary-500">
                {row.completedItems} of {row.itemCount} complete
              </p>
            </div>
          )}

          <div>
            <Link
              to={row.to}
              state={{ from: location }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
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
