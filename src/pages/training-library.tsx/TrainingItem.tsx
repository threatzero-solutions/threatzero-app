import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { emitVideoEvent, getTrainingItem } from "../../queries/training";
import { useQuery } from "@tanstack/react-query";
import ReactPlayer, { ReactPlayerProps } from "react-player/lazy";
import VimeoPlayer, { VimeoPlayerProps } from "react-player/vimeo";
import { Video } from "../../types/entities";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { READ } from "../../constants/permissions";
import { TrainingContext } from "../../contexts/training/training-context";
import TrainingItemTile from "./components/TrainingItemTile";
import { VideoEventType } from "../../types/entities";
import { ErrorBoundary } from "react-error-boundary";

interface VideoURLMapping {
	hls: string | null;
	mp4: string | null;
}

const VideoUnavailable: React.FC = () => (
	<div className="w-full aspect-video flex justify-center items-center bg-gray-900">
		<p className="text-center text-white">Video unavailable.</p>
	</div>
);

const TrainingItem: React.FC = () => {
	const [videoUrl, setVideoUrl] = useState<string | null>(null);

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
				s.items?.some((i) => i.item.id === itemId),
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
		[itemId, sectionId],
	);

	const { data: item } = useQuery({
		queryKey: ["item", itemId],
		queryFn: ({ queryKey }) => getTrainingItem(queryKey[1]),
		staleTime: 1000 * 60 * 30, // 30 minutes
});

	useEffect(() => {
		// Prefer Vimeo if set.
		const vimeoUrl = (item as Video | undefined)?.vimeoUrl;
		if (vimeoUrl) {
			setVideoUrl(vimeoUrl);
			return;
		}

		const urlMapping: VideoURLMapping = {
			hls: null,
			mp4: null,
		};

		const mediaUrls = (item as Video | undefined)?.mediaUrls;
		if (mediaUrls?.length) {
			for (const url of mediaUrls) {
				const ext = url.split("?")[0].split(".").pop();
				switch (ext) {
					case "m3u8":
						urlMapping.hls = url;
						continue;
					case "mp4":
						urlMapping.mp4 = url;
						continue;
				}
			}

			setVideoUrl(urlMapping.hls ?? urlMapping.mp4);
		}
	}, [item]);

	const handleVideoError = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: ...
		(error: unknown, data?: any, hlsInstance?: any, hlsGlobal?: any) => {
			if (hlsInstance && hlsGlobal && data.fatal) {
				switch (data.type) {
					case hlsGlobal.ErroTypes.MEDIA_ERROR:
						console.warn(
							"Fatal media error encountered while loading video, trying to recover.",
							data,
						);
						hlsInstance.recoverMediaError();
						break;
					case hlsGlobal.ErroTypes.NETWORK_ERROR:
						console.error(
							"Fatal network error encountered while loading video.",
							data,
						);
						break;
					default:
						console.error("Fatal error encountered while loading video.", data);
						hlsInstance.destroy();
						break;
				}
			} else {
				console.error("Error loading video", error, data);
			}
			emitItemVideoEvent({ type: VideoEventType.ERROR, data: { error } });
		},
		[emitItemVideoEvent],
	);

	const reactPlayerProps: ReactPlayerProps = useMemo(() => {
		if (!videoUrl) {
			return {};
		}

		return {
			url: videoUrl,
			controls: true,
			width: "100%",
			height: "unset",
			style: {
				aspectRatio: "16/9",
			},
			config: {
				hlsOptions: {
					manifestLoadPolicy: {
						default: {
							maxTimeToFirstByteMs: 10000,
							maxLoadTimeMs: 20000,
							timeoutRetry: {
								maxNumRetry: 2,
								retryDelayMs: 0,
								maxRetryDelayMs: 0,
							},
							errorRetry: {
								maxNumRetry: 1,
								retryDelayMs: 1000,
								maxRetryDelayMs: 8000,
							},
						},
					},
				},
			},
			onPlay: () => emitItemVideoEvent({ type: VideoEventType.PLAY }),
			onPause: () => emitItemVideoEvent({ type: VideoEventType.PAUSE }),
			onProgress: (e) =>
				emitItemVideoEvent({
					type: VideoEventType.PROGRESS,
					data: e,
				}),
			onDuration: () => emitItemVideoEvent({ type: VideoEventType.DURATION }),
			onEnded: () => emitItemVideoEvent({ type: VideoEventType.END }),
			onError: handleVideoError,
			onReady: () => emitItemVideoEvent({ type: VideoEventType.READY }),
			onBuffer: () => emitItemVideoEvent({ type: VideoEventType.BUFFER }),
			onBufferEnd: () =>
				emitItemVideoEvent({ type: VideoEventType.BUFFER_END }),
			onSeek: (seconds) =>
				emitItemVideoEvent({
					type: VideoEventType.SEEK,
					data: { seconds },
				}),
			onStart: () => emitItemVideoEvent({ type: VideoEventType.START }),
			onClickPreview: (e) =>
				emitItemVideoEvent({
					type: VideoEventType.CLICK_PREVIEW,
					data: e,
				}),
			onDisablePIP: () =>
				emitItemVideoEvent({ type: VideoEventType.DISABLE_PIP }),
			onEnablePIP: () =>
				emitItemVideoEvent({ type: VideoEventType.ENABLE_PIP }),
		} as ReactPlayerProps;
	}, [videoUrl, handleVideoError, emitItemVideoEvent]);

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
							{videoUrl ? (
								<ErrorBoundary
									fallback={<VideoUnavailable />}
									onError={handleVideoError}
								>
									{videoUrl.includes("vimeo.com") ? (
										<VimeoPlayer {...(reactPlayerProps as VimeoPlayerProps)} />
									) : (
										<ReactPlayer {...reactPlayerProps} />
									)}
								</ErrorBoundary>
							) : (item as Video).embeddedHtml ? (
								<div
									// biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
									dangerouslySetInnerHTML={{
										__html: (item as Video).embeddedHtml ?? "",
									}}
									className="w-full aspect-video"
								/>
							) : (
								<VideoUnavailable />
							)}
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
	trainingItemPermissionsOptions,
);
