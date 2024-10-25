import { useParams, useSearchParams } from "react-router-dom";
import {
  createItemCompletion,
  getMyItemCompletion,
  getTrainingItem,
  updateItemCompletion,
} from "../../queries/training";
import { useMutation, useQuery } from "@tanstack/react-query";
import BackButton from "../../components/layouts/BackButton";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TrainingContext } from "../../contexts/training/training-context";
import TrainingItemTile from "./components/TrainingItemTile";
import { Video } from "../../types/entities";
import { ErrorBoundary } from "react-error-boundary";
import { useAuth } from "../../contexts/AuthProvider";
import VimeoPlayer, {
  ProgressEventData,
} from "../../components/media/VimeoPlayer";
import type Vimeo from "@vimeo/player";
import VideoProgress from "./components/VideoProgress";
import { useImmer } from "use-immer";
import { useDebounceCallback } from "usehooks-ts";

const COMPLETION_THRESHOLD = 0.85;

const VideoUnavailable: React.FC = () => (
  <div className="w-full h-full flex justify-center items-center bg-gray-900">
    <p className="text-center text-white">Video unavailable.</p>
  </div>
);

const TrainingItem: React.FC = () => {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useContext(TrainingContext);
  const itemCompletionId = useRef<string | null | undefined>(undefined);

  const [videoProgress, setVideoProgress] = useImmer({
    duration: 100,
    seconds: 0,
  });

  const [videoDuration, setVideoDuration] = useState(100);
  const [videoStartingTime, setVideoStartingTime] = useState<
    number | undefined
  >();

  const { authenticated } = useAuth();

  const sectionId = useMemo(() => {
    const sId = searchParams.get("sectionId");
    if (sId) {
      return sId;
    }

    if (state.activeCourse) {
      return state.activeCourse.sections.find((s) =>
        s.items?.some((i) => i.item.id === itemId)
      )?.id;
    }
  }, [searchParams, state.activeCourse, itemId]);

  const watchId = useMemo(() => {
    return searchParams.get("watchId");
  }, [searchParams]);

  const { data: item } = useQuery({
    queryKey: ["item", itemId, watchId] as const,
    queryFn: ({ queryKey }) => getTrainingItem(queryKey[1], queryKey[2]),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: itemCompletion } = useQuery({
    queryKey: ["item-completion", state.activeCourse?.id, itemId] as const,
    queryFn: ({ queryKey }) =>
      getMyItemCompletion(queryKey[2]!, queryKey[1], watchId).then((i) => {
        itemCompletionId.current = i?.id ?? null;
        return i;
      }),
    enabled: !!itemId,
    refetchOnWindowFocus: false,
  });

  const createVideoProgressMutation = useMutation({
    mutationFn: () =>
      createItemCompletion(
        {
          itemId: itemId!,
          sectionId,
          courseId: state.activeCourse?.id,
          url: window.location.href,
        },
        watchId
      ),
    onSuccess: (data) => {
      itemCompletionId.current = data.id;
    },
  });

  const updateVideoProgressMutation = useMutation({
    mutationFn: (input: { progress: number; completed: boolean }) =>
      itemCompletionId.current
        ? updateItemCompletion(
            itemCompletionId.current,
            input.progress,
            input.completed,
            watchId
          )
        : Promise.reject("No existing completion data to update."),
  });

  const saveVideoProgress = useDebounceCallback(
    (progress: number, completed: boolean) =>
      itemCompletionId.current
        ? updateVideoProgressMutation.mutate({
            progress,
            completed,
          })
        : itemCompletionId.current === null
        ? createVideoProgressMutation.mutate()
        : null,
    500,
    {
      maxWait: 2000,
      trailing: true,
    }
  );

  const handleVideoError = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: ...
    (error: unknown, data?: unknown) => {
      console.error("Error loading video", error, data);
      // emitItemVideoEvent({ type: VideoEventType.ERROR, data: { error } });
    },
    []
  );

  const handleVideoProgress = (data: ProgressEventData) => {
    if (data.hasSeeked) {
      return;
    }

    setVideoProgress((draft) => {
      draft.duration = data.totalDuration;
      draft.seconds = data.progressSeconds;
    });

    if (data.progressPercent < 1) {
      saveVideoProgress(
        data.progressPercent,
        data.progressPercent >= COMPLETION_THRESHOLD
      );
    }
  };

  const handlePlayerReady = (player: Vimeo) => {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        player.pause().catch(() => {});
      }
    });

    player.getDuration().then((duration) => {
      setVideoDuration(duration);
    });
  };

  useEffect(() => {
    const progress = itemCompletion?.progress;
    if (progress) {
      setVideoProgress((draft) => {
        draft.seconds = +progress * videoDuration;
        draft.duration = videoDuration;
      });

      setVideoStartingTime(+progress * videoDuration);
    }
  }, [itemCompletion, videoDuration, setVideoProgress]);

  return (
    <div>
      {authenticated && <BackButton defaultTo={"/training/library"} />}
      {item ? (
        <>
          {item.prerequisitesFulfilled ? (
            <>
              <div className="w-full aspect-video">
                {(item as Video).vimeoUrl ? (
                  <ErrorBoundary
                    fallback={<VideoUnavailable />}
                    onError={handleVideoError}
                  >
                    <VimeoPlayer
                      url={(item as Video).vimeoUrl ?? ""}
                      controls={true}
                      responsive={true}
                      className="h-full w-full"
                      onReady={handlePlayerReady}
                      onError={handleVideoError}
                      onProgress={handleVideoProgress}
                      currentTime={videoStartingTime}
                    />
                  </ErrorBoundary>
                ) : (
                  <VideoUnavailable />
                )}
              </div>
              <div className="flex gap-2 w-full">
                <div className="grow">
                  <h1
                    className="text-2xl my-1 mt-4"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                    dangerouslySetInnerHTML={{ __html: item.metadata.title }}
                  />
                  <p
                    className="text-gray-500 text-md"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                    dangerouslySetInnerHTML={{
                      __html: item.metadata.description ?? "",
                    }}
                  />
                </div>
                <VideoProgress
                  duration={videoProgress.duration}
                  currentTime={videoProgress.seconds}
                  completionThreshold={COMPLETION_THRESHOLD}
                  className="h-12 w-12 self-center shrink-0"
                />
              </div>
            </>
          ) : (
            <>
              <h2>Notice: This item has prerequired training material</h2>
              <h3>
                The following material must be completed before viewing this
                training item:
              </h3>
              <ul>
                {item.prerequisiteItems.map((p) => (
                  <li key={p.id}>
                    <TrainingItemTile item={p} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <div className="w-full">
          <div className="animate-pulse flex-1">
            <div className="aspect-video bg-slate-200 rounded" />
            <div className="h-8 bg-slate-200 rounded mt-4 mb-1" />
            <div className="h-6 bg-slate-200 rounded" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingItem;
