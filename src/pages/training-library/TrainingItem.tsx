import { useParams, useSearchParams } from "react-router-dom";
import { getTrainingItem } from "../../queries/training";
import { useQuery } from "@tanstack/react-query";
import BackButton from "../../components/layouts/BackButton";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const VideoUnavailable: React.FC = () => (
  <div className="w-full h-full flex justify-center items-center bg-gray-900">
    <p className="text-center text-white">Video unavailable.</p>
  </div>
);

const TrainingItem: React.FC = () => {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useContext(TrainingContext);

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

  const saveVideoProgress = useDebounceCallback(
    (progress: number) =>
      console.debug(
        {
          progress: progress,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          itemId: itemId,
          sectionId: sectionId,
          courseId: state.activeCourse?.id,
        },
        watchId
      ),
    500,
    {
      maxWait: 2000,
      trailing: true,
    }
  );

  const { data: item } = useQuery({
    queryKey: ["item", itemId, watchId] as const,
    queryFn: ({ queryKey }) => getTrainingItem(queryKey[1], queryKey[2]),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleVideoError = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: ...
    (error: unknown, data?: unknown) => {
      console.error("Error loading video", error, data);
      // emitItemVideoEvent({ type: VideoEventType.ERROR, data: { error } });
    },
    []
  );

  const handleVideoProgress = (data: ProgressEventData) => {
    setVideoProgress((draft) => {
      draft.duration = data.totalDuration;
      draft.seconds = data.progressSeconds;
    });

    saveVideoProgress(data.progressPercent);
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
    // TODO: Get saved progress
    const progress = searchParams.get("progress");
    if (progress) {
      setVideoProgress((draft) => {
        draft.seconds = +progress * videoDuration;
        draft.duration = videoDuration;
      });

      setVideoStartingTime(+progress * videoDuration);
    }
  }, [searchParams, videoDuration, setVideoProgress]);

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
              <div className="flex gap-2">
                <div>
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
