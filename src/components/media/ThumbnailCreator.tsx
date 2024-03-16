import dayjs from "dayjs";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { classNames } from "../../utils/core";

interface ThumbnailCreatorProps {
	videoSrc?: string;
	setThumbnail: (thumbnail: File) => void;
	disabled?: boolean;
	onSave?: (file: File) => void;
	saveProcessing?: boolean;
}

const ThumbnailCreator: React.FC<ThumbnailCreatorProps> = ({
	videoSrc,
	setThumbnail,
	disabled,
	onSave,
	saveProcessing,
}) => {
	const videoEl = useRef<HTMLVideoElement>();
	const [videoElPlayable, setVideoElPlayable] = useState(false);
	const [duration, setDuration] = useState(0);
	const [thumbnailAtVideoTime, setThumbnailAtVideoTime] = useState(0);
	const [thumbnailInternal, setThumbnailInternal] = useState<File>();
	const [loading, setLoading] = useState(false);
	const videoSeekDebounceTimeout = useRef<number>();

	useEffect(() => {
		if (!videoSrc || (videoEl.current && videoEl.current.src === videoSrc)) {
			return;
		}

		const video = document.createElement("video");
		video.preload = "metadata";
		video.autoplay = false;
		video.crossOrigin = "anonymous";
		video.src = videoSrc;

		video.onloadeddata = () => {
			videoEl.current = video;
		};

		video.oncanplay = (e) => {
			setVideoElPlayable(true);

			const video = e.target as HTMLVideoElement;
			setDuration(Number.isFinite(video.duration) ? video.duration : 0);
		};

		return () => {
			video.pause();
			video.src = "";
		};
	}, [videoSrc]);

	const handleSetThumbnail = (file: File) => {
		setThumbnail(file);
		setThumbnailInternal(file);
	};

	const handleCreateThumbnail = (e: ChangeEvent<HTMLInputElement>) => {
		if (!videoEl.current || !videoElPlayable) return;

		setLoading(true);

		const selectedVideoTime = +e.target.value;
		setThumbnailAtVideoTime(selectedVideoTime);

		const createThumbnail = () =>
			new Promise<void>((resolve, reject) => {
				if (!videoEl.current) return reject("No video element");

				videoEl.current.onseeked = (e) => {
					if (!e.target) {
						return reject("No video element");
					}
					const video = e.target as HTMLVideoElement;

					const canvas = document.createElement("canvas");
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;

					const ctx = canvas.getContext("2d");

					if (!ctx) return resolve();

					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

					const url = canvas.toDataURL();
					fetch(url)
						.then((res) => res.blob())
						.then(
							(blob) =>
								new File([blob], "thumbnail.png", { type: "image/png" }),
						)
						.then(handleSetThumbnail)
						.then(() => setLoading(false))
						.then(resolve);
				};

				videoEl.current.currentTime = selectedVideoTime;
			});

		clearTimeout(videoSeekDebounceTimeout.current);
		videoSeekDebounceTimeout.current = setTimeout(() => {
			createThumbnail();
		}, 500);
	};

	return (
		<>
			<label htmlFor="thumbnail-seek">
				<input
					type="range"
					id="thumbnail-seek"
					name="thumbnail-seek"
					disabled={disabled || !videoElPlayable}
					defaultValue={0}
					onChange={handleCreateThumbnail}
					min={0}
					max={duration}
					step={0.1}
					className="w-full"
				/>
				<div className="flex justify-between items-center">
					<span>
						{dayjs.duration(thumbnailAtVideoTime, "seconds").format("mm:ss")}
						{loading && (
							<span className="ml-2 animate-pulse italic">Loading...</span>
						)}
					</span>
					{onSave && (
						<button
							type="button"
							disabled={!thumbnailInternal || loading || saveProcessing}
							onClick={() => thumbnailInternal && onSave(thumbnailInternal)}
							className={classNames(
								"rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50",
								saveProcessing ? "animate-pulse" : "",
							)}
						>
							Upload
						</button>
					)}
				</div>
			</label>
		</>
	);
};

export default ThumbnailCreator;
