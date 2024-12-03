import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { TrainingSection } from "../../../types/entities";
import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import {
  EllipsisVerticalIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../../../utils/core";
import { TrainingContext } from "../../../contexts/training/training-context";
import VideoProgress from "./VideoProgress";
import { FeaturedWindow } from "../../../types/training";
import { DEFAULT_THUMBNAIL_URL } from "../../../constants/core";
import Dropdown from "../../../components/layouts/Dropdown";
import {
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { swapTrainingSectionOrders } from "../../../queries/training";

dayjs.extend(duration);
dayjs.extend(relativeTime);

interface TrainingSectionTileProps {
  section: Partial<TrainingSection>;
  className?: string;
  onEditSection?: (section?: Partial<TrainingSection>) => void;
  navigateDisabled?: boolean;
  featuredWindow?: FeaturedWindow | null;
  previousSection?: Partial<TrainingSection>;
  nextSection?: Partial<TrainingSection>;
}

const TrainingSectionTile: React.FC<TrainingSectionTileProps> = ({
  section,
  className,
  onEditSection,
  navigateDisabled: navigateDisabledProp,
  featuredWindow,
  previousSection,
  nextSection,
}) => {
  const { state } = useContext(TrainingContext);

  const location = useLocation();

  const firstItem = useMemo(() => section.items?.[0]?.item, [section.items]);
  const singleItem = useMemo(
    () => section.items?.length === 1,
    [section.items]
  );
  const [isHover, setIsHover] = useState(false);

  const navigate = useNavigate();

  const navigateDisabled = useMemo(
    () => navigateDisabledProp || !!onEditSection,
    [navigateDisabledProp, onEditSection]
  );

  const availability = useMemo(() => {
    if (!featuredWindow) {
      return "";
    }

    const { featuredOn, featuredUntil } = featuredWindow;

    if (!featuredOn.isValid()) {
      return "";
    }

    const defaultFormat = "MMM D, YYYY";

    if (!featuredUntil.isValid()) {
      return featuredOn.format(defaultFormat);
    }

    if (featuredOn.isSame(featuredUntil, "year")) {
      const yearSuffix = `, ${featuredUntil.format("YYYY")}`;
      if (featuredOn.isSame(featuredUntil, "month")) {
        return `${featuredOn.format("MMM D")} - ${featuredUntil.format(
          "D"
        )}${yearSuffix}`;
      }
      return `${featuredOn.format("MMM D")} - ${featuredUntil.format(
        "MMM D"
      )}${yearSuffix}`;
    }

    return `${featuredOn.format(defaultFormat)} - ${featuredUntil.format(
      defaultFormat
    )}`;
  }, [featuredWindow]);

  const completionProps = useMemo(() => {
    return (
      state.itemCompletionsMap &&
      section.items?.reduce(
        (acc, item) => {
          if (item?.item) {
            const completion = state.itemCompletionsMap!.get(item.item.id);
            if (completion) {
              acc.duration += 1;
              acc.currentTime = completion.progress;
            }
          }

          return acc;
        },
        { duration: 0, currentTime: 0 }
      )
    );
  }, [state.itemCompletionsMap, section.items]);

  const queryClient = useQueryClient();
  const swapSectionOrdersMutation = useMutation({
    mutationFn: (data: {
      sectionA: Partial<TrainingSection>;
      sectionB: Partial<TrainingSection>;
    }) => swapTrainingSectionOrders(data.sectionA, data.sectionB),
    onSuccess: ([dataA, dataB]) => {
      queryClient.invalidateQueries({
        queryKey: ["training-section", "id", dataA.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["training-section", "id", dataB.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["training-course", "id", dataA.courseId],
      });
    },
  });

  const navigateToSection = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      if (e.type === "keyup" && (e as KeyboardEvent).key !== "Enter") {
        return;
      }

      if (navigateDisabled) {
        return;
      }

      navigate(`/training/library/sections/${section.id}`, {
        state: { from: location },
      });
    },
    [location, navigate, section.id, navigateDisabled]
  );

  return (
    <div
      className={classNames(
        "relative",
        !navigateDisabled ? "cursor-pointer" : ""
      )}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={navigateToSection}
      onKeyUp={navigateToSection}
    >
      <div
        className={classNames(
          "col-span-1 grid grid-cols-video-card rounded-md overflow-hidden grid-rows-video-card h-full",
          className
        )}
      >
        <div className={"flex pt-64 overflow-hidden relative"}>
          <img
            className={classNames(
              isHover && !navigateDisabled
                ? "w-[105%] h-[105%]"
                : "w-full h-full",
              "absolute object-cover transition-all duration-300 ease-out inset-0"
            )}
            src={firstItem?.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL}
            alt={firstItem?.metadata?.title ?? "Training Material"}
          />
        </div>
        <div className="flex flex-col min-w-32 justify-between px-6 py-4 text-sm bg-white">
          <div>
            <p className="text-gray-500 text-xs">{availability}</p>
            <h2
              className="text-lg my-1"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{
                __html:
                  (singleItem
                    ? firstItem?.metadata.title
                    : section.metadata?.title) ?? "",
              }}
            />
            <p
              className="text-gray-500 text-md line-clamp-5"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{
                __html:
                  (singleItem
                    ? firstItem?.metadata.description
                    : section.metadata?.description) ?? "",
              }}
            />
          </div>
          <div className="flex items-center mt-6">
            <p className="text-gray-500 text-xs">
              {singleItem ? (
                <span>
                  {firstItem?.estCompletionTime
                    ? dayjs.duration(firstItem.estCompletionTime).humanize()
                    : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Square3Stack3DIcon className="h-5 w-5 text-gray-400" />
                  {section.items?.length || 0} items
                </span>
              )}
            </p>
            <div className="grow" />
            {!onEditSection && !navigateDisabled && completionProps && (
              <VideoProgress {...completionProps} className="h-10 w-10" />
            )}
            {onEditSection && (
              <Dropdown
                value="Open training section actions"
                valueIcon={
                  <EllipsisVerticalIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                }
                iconOnly
                strategy="fixed"
                actions={[
                  {
                    id: "edit",
                    value: (
                      <span className="inline-flex items-center">
                        <PencilSquareIcon className="h-4 w-4 mr-1 text-gray-600" />
                        Edit
                      </span>
                    ),
                    action: () => onEditSection(section),
                  },
                  {
                    id: "move-back",
                    value: (
                      <span
                        className={classNames(
                          "inline-flex items-center",
                          !previousSection ? "opacity-50" : ""
                        )}
                      >
                        <ArrowLeftCircleIcon className="h-5 w-5 mr-1 text-secondary-600" />
                        Move back
                      </span>
                    ),
                    disabled: !previousSection,
                    action: () => {
                      if (previousSection) {
                        swapSectionOrdersMutation.mutate({
                          sectionA: section,
                          sectionB: previousSection,
                        });
                      }
                    },
                  },
                  {
                    id: "move-forward",
                    value: (
                      <span
                        className={classNames(
                          "inline-flex items-center",
                          !nextSection ? "opacity-50" : ""
                        )}
                      >
                        <ArrowRightCircleIcon className="h-5 w-5 mr-1 text-secondary-600" />
                        Move forward
                      </span>
                    ),
                    disabled: !nextSection,
                    action: () => {
                      if (nextSection) {
                        swapSectionOrdersMutation.mutate({
                          sectionA: section,
                          sectionB: nextSection,
                        });
                      }
                    },
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingSectionTile;
