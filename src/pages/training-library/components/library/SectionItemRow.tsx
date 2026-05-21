import { Link, useLocation } from "react-router";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import { DEFAULT_THUMBNAIL_URL } from "../../../../constants/core";
import { ItemCompletion, TrainingItem } from "../../../../types/entities";
import { cn } from "../../../../utils/core";
import VideoProgress from "../VideoProgress";
import { stripHtml } from "./useLibraryCourse";

dayjs.extend(duration);
dayjs.extend(relativeTime);

interface SectionItemRowProps {
  item: TrainingItem;
  to: string;
  completion?: ItemCompletion;
}

/**
 * A single training item within a section, rendered as a tappable row:
 * thumbnail, title + blurb + estimated time, and a completion indicator
 * (check when finished, a progress ring while in flight).
 */
const SectionItemRow: React.FC<SectionItemRowProps> = ({
  item,
  to,
  completion,
}) => {
  const location = useLocation();

  const title = stripHtml(item.metadata?.title) || "Untitled item";
  const description = stripHtml(item.metadata?.description);
  const estTime = item.estCompletionTime
    ? dayjs.duration(item.estCompletionTime).humanize()
    : null;

  const completed = !!completion?.completed;
  const progress = completion?.progress ?? 0;

  return (
    <li>
      <Link
        to={to}
        state={{ from: location }}
        className={cn(
          "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all sm:gap-4",
          "hover:border-primary-300 hover:shadow-sm",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        )}
      >
        <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-gray-200">
          <img
            src={item.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-secondary-900">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-secondary-500">
              {description}
            </p>
          )}
          {estTime && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-secondary-400">
              <ClockIcon aria-hidden className="h-3.5 w-3.5" />
              {estTime}
            </p>
          )}
        </div>

        <div className="flex w-9 shrink-0 justify-center">
          {completed ? (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-600 text-white">
              <CheckIcon aria-hidden className="h-4 w-4" />
              <span className="sr-only">Complete</span>
            </span>
          ) : progress > 0 ? (
            <VideoProgress
              duration={1}
              currentTime={progress}
              className="h-9 w-9"
            />
          ) : (
            <ArrowRightIcon
              aria-hidden
              className="h-5 w-5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500"
            />
          )}
        </div>
      </Link>
    </li>
  );
};

export default SectionItemRow;
