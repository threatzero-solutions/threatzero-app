import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type Vimeo from "@vimeo/player";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useParams, useSearchParams } from "react-router";
import { useImmer } from "use-immer";
import { useDebounceCallback } from "usehooks-ts";
import BackButton from "../../components/layouts/BackButton";
import VimeoPlayer, {
  ProgressEventData,
} from "../../components/media/VimeoPlayer";
import {
  ACTUAL_COMPLETION_THRESHOLD,
  DISPLAY_COMPLETION_THRESHOLD,
} from "../../constants/core";
import { useAuth } from "../../contexts/auth/useAuth";
import { useMe } from "../../contexts/me/MeProvider";
import { useResidencePicker } from "../../contexts/me/ResidencePickerProvider";
import { TrainingContext } from "../../contexts/training/training-context";
import {
  getMyItemCompletion,
  getTrainingItem,
  updateOrCreateItemCompletion,
} from "../../queries/training";
import {
  ItemCompletion,
  TrainingItem as TrainingItemType,
  Video,
} from "../../types/entities";
import SectionItemRow from "./components/library/SectionItemRow";
import { stripHtml } from "./components/library/useLibraryCourse";
import VideoProgress from "./components/VideoProgress";

const VideoUnavailable: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-secondary-900">
    <p className="text-center text-sm font-medium text-white">
      Video unavailable.
    </p>
  </div>
);

/** Loading placeholder mirroring the player + title block. */
const PlayerSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="aspect-video w-full rounded-xl bg-gray-200" />
    <div className="mt-5 space-y-2">
      <div className="h-7 w-2/3 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-100" />
    </div>
  </div>
);

/**
 * Prerequisite gate. The backend prerequisite path is largely unbuilt, so
 * this stays intentionally light: it surfaces the blocked state and lists
 * what to finish first, reusing the standard item row.
 */
const PrerequisitesNotice: React.FC<{
  items: TrainingItemType[];
  completions?: Map<string, ItemCompletion>;
}> = ({ items, completions }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-6">
    <h2 className="text-lg font-semibold text-secondary-900">
      Finish the prerequisites first
    </h2>
    <p className="mt-1 text-sm text-secondary-600">
      Complete the training below before starting this item.
    </p>
    {items.length > 0 && (
      <ol className="mt-4 space-y-2">
        {items.map((p) => (
          <SectionItemRow
            key={p.id}
            item={p}
            to={`/training/library/items/${p.id}`}
            completion={completions?.get(p.id)}
          />
        ))}
      </ol>
    )}
  </section>
);

const TrainingItem: React.FC = () => {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useContext(TrainingContext);
  const itemCompletionId = useRef<string | null | undefined>(undefined);
  const queryClient = useQueryClient();

  const [videoProgress, setVideoProgress] = useImmer({
    duration: 100,
    seconds: 0,
  });

  const [videoDuration, setVideoDuration] = useState(100);
  const [videoStartingTime, setVideoStartingTime] = useState<
    number | undefined
  >();

  const { authenticated } = useAuth();
  const { me } = useMe();
  const { requireResidenceUnit, isPickerOpen } = useResidencePicker();

  // Residence gate (`_docs/residence-and-tenant-model.md` §6 + §2.3):
  // when the user is authenticated to a tenant org but has no residence
  // unit set there, block the watch page and open the picker. Browse and
  // library views are NOT gated — only the watch page that can write
  // progress.
  //
  // Public/watch-token viewers (`!authenticated`) don't go through this
  // gate; their token already carries org+unit and the backend's defense-
  // in-depth check will throw `RESIDENCE_UNIT_REQUIRED` if they somehow
  // hit a write without one.
  const tenantOrgId = me?.scope.kind === "tenant" ? me.organization?.id : null;
  const myResidenceForTenant = useMemo(
    () =>
      tenantOrgId
        ? me?.residences.find((r) => r.organizationId === tenantOrgId)
        : undefined,
    [me, tenantOrgId],
  );
  const residenceGateOpen =
    authenticated &&
    !!tenantOrgId &&
    (myResidenceForTenant === undefined ||
      myResidenceForTenant.unitId === null);

  // Open the picker exactly once per gate-open transition. Promise-based:
  // resolves when the user picks (and `/me` invalidates → gate closes) or
  // cancels (gate stays open, but the user is shown the gate copy below).
  const gatePromptedRef = useRef(false);
  useEffect(() => {
    if (!residenceGateOpen || !tenantOrgId) {
      gatePromptedRef.current = false;
      return;
    }
    if (gatePromptedRef.current) return;
    gatePromptedRef.current = true;
    void requireResidenceUnit({
      organizationId: tenantOrgId,
      dismissible: false,
      reason:
        "Before we can record your training progress, tell us where you are most of the time.",
    });
  }, [residenceGateOpen, tenantOrgId, requireResidenceUnit]);

  const sectionId = useMemo(() => {
    const sId = searchParams.get("sectionId");
    if (sId) {
      return sId;
    }

    if (state.activeCourse) {
      return state.activeCourse.sections.find((s) =>
        s.items?.some((i) => i.item.id === itemId),
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
    queryKey: ["item-completions", state.activeEnrollment?.id, itemId] as const,
    queryFn: ({ queryKey }) =>
      getMyItemCompletion(queryKey[2]!, queryKey[1], watchId).then((i) => {
        itemCompletionId.current = i?.id ?? null;
        return i;
      }),
    enabled: !!itemId,
    refetchOnWindowFocus: false,
  });

  const { mutate: reportTrainingProgress } = useMutation({
    mutationFn: (input: { progress: number; completed: boolean }) =>
      updateOrCreateItemCompletion(
        {
          itemId: itemId ?? "",
          sectionId,
          enrollmentId: state.activeEnrollment?.id,
          url: window.location.href,
          progress: input.progress,
          completed: input.completed,
        },
        watchId,
      ),
  });

  const saveVideoProgress = useDebounceCallback(
    (progress: number, completed: boolean) =>
      reportTrainingProgress({
        progress,
        completed,
      }),
    500,
    {
      maxWait: 2000,
      trailing: true,
    },
  );

  const handleVideoError = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: ...
    (error: unknown, data?: unknown) => {
      console.error("Error loading video", error, data);
    },
    [],
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
        data.progressPercent >= ACTUAL_COMPLETION_THRESHOLD,
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

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({
        predicate: (q) =>
          !!q.queryKey[1] &&
          typeof q.queryKey[1] === "object" &&
          (q.queryKey[1] as Record<string, string>)["enrollment.id"] ===
            state.activeEnrollment?.id,
      });
    };
  }, [queryClient, state.activeEnrollment?.id]);

  if (residenceGateOpen) {
    // Two layered states for the same gate condition:
    //   - Modal up → render a quiet, non-redundant placeholder. The modal
    //     carries the message; duplicating it underneath was confusing.
    //   - Modal NOT up (escaped, dismissed, or pre-mount race) → surface
    //     the explanatory note here so the page isn't mysteriously blank.
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {authenticated && <BackButton defaultTo={"/training/library"} />}
        {isPickerOpen ? (
          <div
            aria-hidden="true"
            className="mt-2 select-none space-y-3 opacity-30"
          >
            <div className="aspect-video w-full rounded-xl bg-gray-200" />
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-center">
            <p className="mx-auto max-w-sm text-sm text-secondary-600">
              Pick your home base before starting training. Your progress gets
              attributed there.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {authenticated && <BackButton defaultTo={"/training/library"} />}

      {!item ? (
        <PlayerSkeleton />
      ) : item.prerequisitesFulfilled ? (
        <>
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-secondary-900">
            {(item as Video).vimeoUrl ? (
              <ErrorBoundary
                fallback={<VideoUnavailable />}
                onError={handleVideoError}
              >
                <VimeoPlayer
                  url={(item as Video).vimeoUrl ?? ""}
                  controls
                  responsive
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

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-secondary-900">
                {stripHtml(item.metadata.title) || "Training"}
              </h1>
              {stripHtml(item.metadata.description) && (
                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-secondary-600">
                  {stripHtml(item.metadata.description)}
                </p>
              )}
            </div>
            <VideoProgress
              duration={videoProgress.duration}
              currentTime={videoProgress.seconds}
              completionThreshold={DISPLAY_COMPLETION_THRESHOLD}
              className="h-12 w-12 shrink-0"
            />
          </div>
        </>
      ) : (
        <PrerequisitesNotice
          items={item.prerequisiteItems}
          completions={state.itemCompletionsMap}
        />
      )}
    </div>
  );
};

export default TrainingItem;
