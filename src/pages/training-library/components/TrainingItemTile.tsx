import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { TrainingItem } from "../../../types/entities";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../../../utils/core";
import { useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_THUMBNAIL_URL } from "../../../constants/core";
import VideoProgress from "./VideoProgress";
import { TrainingContext } from "../../../contexts/training/training-context";

dayjs.extend(duration);
dayjs.extend(relativeTime);

interface TrainingItemTileProps {
  item: Partial<TrainingItem>;
  className?: string;
  onRemoveItem?: (item?: Partial<TrainingItem>) => void;
  onAddItem?: (item?: Partial<TrainingItem>) => void;
  onEditItem?: (item?: Partial<TrainingItem>) => void;
  dense?: boolean;
  selected?: boolean;
  navigateDisabled?: boolean;
}

const TrainingItemTile: React.FC<TrainingItemTileProps> = ({
  item,
  className,
  onRemoveItem,
  onAddItem,
  onEditItem,
  dense,
  selected,
  navigateDisabled,
}) => {
  const { state } = useContext(TrainingContext);
  const [isHover, setIsHover] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToItem = useCallback(() => {
    if (navigateDisabled) {
      return;
    }

    navigate(
      `/training/library/items/${item?.id ?? "unknown"}${
        params.sectionId ? `?sectionId=${params.sectionId}` : ""
      }`,
      {
        state: { from: location },
      }
    );
  }, [navigate, item?.id, navigateDisabled, params.sectionId, location]);

  const completionProps = useMemo(() => {
    const completion = state.itemCompletionsMap?.get(item.id ?? "");
    if (completion) {
      return {
        duration: 1,
        currentTime: completion.progress,
      };
    } else {
      return {
        duration: 1,
        currentTime: 0,
      };
    }
  }, [state.itemCompletionsMap, item.id]);

  return (
    <div
      className={classNames(
        "relative",
        !navigateDisabled ? "cursor-pointer" : ""
      )}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={navigateToItem}
      onKeyUp={() => {}}
    >
      <div
        className={classNames(
          "col-span-1 grid rounded-md overflow-hidden grid-cols-video-card h-full",
          dense ? "grid-rows-video-card-dense" : "grid-rows-video-card",
          selected ? "ring-secondary-600 ring-2" : "",
          className
        )}
      >
        <div
          className={classNames(
            dense ? "pt-32" : "pt-64",
            "flex overflow-hidden relative"
          )}
        >
          <img
            className={classNames(
              isHover && !navigateDisabled
                ? "w-[105%] h-[105%]"
                : "w-full h-full",
              "absolute object-cover transition-all duration-300 ease-out inset-0"
            )}
            src={item?.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL}
            alt={item?.metadata?.title}
          />
        </div>
        <div className="flex flex-col min-w-32 justify-between px-6 py-4 text-sm bg-white">
          <div>
            <h2
              className="text-lg my-1"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{ __html: item?.metadata?.title ?? "" }}
            />
            <p
              className="text-gray-500 text-md line-clamp-5"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{
                __html: item?.metadata?.description ?? "",
              }}
            />
          </div>
          <div className="flex items-center mt-6">
            <p className="text-gray-500 text-xs">
              <span>
                {item?.estCompletionTime
                  ? dayjs.duration(item.estCompletionTime).humanize()
                  : ""}
              </span>
            </p>
            <div className="grow" />
            {!dense && completionProps && (
              <VideoProgress {...completionProps} className="h-10 w-10" />
            )}
            <div className="flex gap-2 ml-4">
              {onRemoveItem &&
                (selected === undefined || selected === true) && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item)}
                    className="block text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">
                      Remove item {item?.metadata?.title}
                    </span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              {onAddItem && !selected && (
                <button
                  type="button"
                  onClick={() => onAddItem(item)}
                  className="block text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">
                    Add item {item?.metadata?.title}
                  </span>
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              {onEditItem && !onAddItem && !onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="block text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">
                    Edit item {item?.metadata?.title}
                  </span>
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingItemTile;
