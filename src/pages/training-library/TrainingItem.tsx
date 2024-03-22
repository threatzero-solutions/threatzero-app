import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { emitVideoEvent, getTrainingItem } from "../../queries/training";
import { useQuery } from "@tanstack/react-query";
import VimeoPlayer from "react-player/vimeo";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import { useCallback, useContext, useMemo } from "react";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { READ } from "../../constants/permissions";
import { TrainingContext } from "../../contexts/training/training-context";
import TrainingItemTile from "./components/TrainingItemTile";
import { VideoEventType } from "../../types/entities";
import { ErrorBoundary } from "react-error-boundary";

const VideoUnavailable: React.FC = () => (
  <div className="w-full h-full flex justify-center items-center bg-gray-900">
    <p className="text-center text-white">Video unavailable.</p>
  </div>
);

const TrainingItem: React.FC = () => {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useContext(TrainingContext);
  const location = useLocation();

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

  const emitItemVideoEvent = useCallback(
    ({ type, data }: { type: VideoEventType; data?: unknown }) =>
      emitVideoEvent({
        type,
        eventData: data ?? {},
        timestamp: new Date().toISOString(),
        url: window.location.href,
        itemId: itemId,
        sectionId: sectionId,
      }),
    [itemId, sectionId]
  );

  const { data: item } = useQuery({
    queryKey: ["item", itemId],
    queryFn: ({ queryKey }) => getTrainingItem(queryKey[1]),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleVideoError = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: ...
    (error: unknown, data?: any) => {
      console.error("Error loading video", error, data);
      emitItemVideoEvent({ type: VideoEventType.ERROR, data: { error } });
    },
    [emitItemVideoEvent]
  );

  return (
    <div>
      <BackButtonLink
        to={
          location.state?.pathname
            ? (location.state as Location)
            : "/training/library"
        }
      />
      {item ? (
        <>
          {item.prerequisitesFulfilled ? (
            <>
              <div className="w-full aspect-video">
                {item.vimeoUrl ? (
                  <ErrorBoundary
                    fallback={<VideoUnavailable />}
                    onError={handleVideoError}
                  >
                    <VimeoPlayer
                      url={item.vimeoUrl}
                      controls={true}
                      width={"100%"}
                      height={"100%"}
                      config={{
                        playerOptions: {
                          responsive: true,
                        },
                      }}
                      onPlay={() =>
                        emitItemVideoEvent({ type: VideoEventType.PLAY })
                      }
                      onPause={() =>
                        emitItemVideoEvent({ type: VideoEventType.PAUSE })
                      }
                      onProgress={(e) =>
                        emitItemVideoEvent({
                          type: VideoEventType.PROGRESS,
                          data: e,
                        })
                      }
                      onDuration={() =>
                        emitItemVideoEvent({ type: VideoEventType.DURATION })
                      }
                      onEnded={() =>
                        emitItemVideoEvent({ type: VideoEventType.END })
                      }
                      onError={handleVideoError}
                      onReady={() =>
                        emitItemVideoEvent({ type: VideoEventType.READY })
                      }
                      onBuffer={() =>
                        emitItemVideoEvent({ type: VideoEventType.BUFFER })
                      }
                      onBufferEnd={() =>
                        emitItemVideoEvent({ type: VideoEventType.BUFFER_END })
                      }
                      onSeek={(seconds) =>
                        emitItemVideoEvent({
                          type: VideoEventType.SEEK,
                          data: { seconds },
                        })
                      }
                      onStart={() =>
                        emitItemVideoEvent({ type: VideoEventType.START })
                      }
                      onClickPreview={(e) =>
                        emitItemVideoEvent({
                          type: VideoEventType.CLICK_PREVIEW,
                          data: e,
                        })
                      }
                      onDisablePIP={() =>
                        emitItemVideoEvent({ type: VideoEventType.DISABLE_PIP })
                      }
                      onEnablePIP={() =>
                        emitItemVideoEvent({ type: VideoEventType.ENABLE_PIP })
                      }
                    />
                  </ErrorBoundary>
                ) : (
                  <VideoUnavailable />
                )}
              </div>
              <h1
                className="text-2xl my-1 mt-4"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                dangerouslySetInnerHTML={{ __html: item.metadata.title }}
              />
              <p
                className="text-gray-500 text-md"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                dangerouslySetInnerHTML={{ __html: item.metadata.description }}
              />
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

export const trainingItemPermissionsOptions = {
  permissions: [READ.COURSES],
};

export default withRequirePermissions(
  TrainingItem,
  trainingItemPermissionsOptions
);
