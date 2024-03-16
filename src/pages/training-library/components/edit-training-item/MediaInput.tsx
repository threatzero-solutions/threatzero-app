import {
	ChangeEvent,
	Dispatch,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Field, Video } from "../../../../types/entities";
import InputRadioOptions from "./InputRadioOptions";
import { CheckIcon } from "@heroicons/react/24/outline";
import {
	MultipartUploadProgress,
	MultipartUploader,
} from "../../../../utils/multipart-uploader";
import { classNames, pathJoin, stripHtml } from "../../../../utils/core";
import { Switch } from "@headlessui/react";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	EncodingJobResponse,
	getEncodingStatusForVideo,
	toggleABRForVideo,
} from "../../../../queries/training";
import { ErrorContext } from "../../../../contexts/error/error-context";
import Input from "../../../../components/forms/inputs/Input";
import { ItemUpdater } from "../../../../types/training";

export enum MediaInputOption {
	UPLOAD_MEDIA = "upload-media",
	EMBED_HTML = "embed-html",
	SET_URL = "set-url",
}

interface MediaInputProps {
	item: Partial<Video>;
	setItem: ItemUpdater;
	input: Partial<Field> & { name: keyof Video };
	setMediaOptionSelected: (option: string) => void;
	setMediaUploading: Dispatch<SetStateAction<boolean>>;
}

const MediaInput: React.FC<MediaInputProps> = ({
	item,
	setItem,
	input,
	setMediaOptionSelected,
	setMediaUploading,
}) => {
	const [uploadProgress, setUploadProgress] = useState<
		MultipartUploadProgress | undefined
	>();
	const [uploadError, setUploadError] = useState<unknown>();
	const [uploadAborted, setUploadAborted] = useState(false);
	const [uploader, setUploader] = useState<MultipartUploader>();

	const [abrEnabled, setAbrEnabled] = useState(false);
	const [abrProcessing, setAbrProcessing] = useState(false);
	const [abrError, setAbrError] = useState<unknown>();
	const checkEncodingStatusTimeout = useRef<number>();
	const pollingEncodingStatus = useRef(false);

	const { setError } = useContext(ErrorContext);

	const handleMediaUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setMediaUploading(true);
			setUploadError(undefined);
			setUploadProgress({ sent: 0, total: 0, percentage: -1 });
			setUploadAborted(false);

			const file = event.target.files?.[0];
			if (!file) {
				return;
			}

			const [fileName, fileExt] = file.name.split(".", 2);

			let key = item.mediaKeys?.find((k) => k.endsWith(fileExt));

			if (!key) {
				// Generate short random string to append to title
				// to prevent title collisions
				const keyRandomizer = (Math.random() + 1).toString(36).substring(7);

				// Default to file name just in case, even though item title should be
				// required.
				const keyPrefix = `${
					stripHtml(item.metadata?.title) ?? fileName
				}-${keyRandomizer}`
					.replace(/[^a-z0-9]/gi, "-")
					.replace(/-+/g, "-")
					.replace(/^-|-$/g, "")
					.toLowerCase();

				key = pathJoin(keyPrefix, "media");
			}

			const uploader = new MultipartUploader({
				file,
				fileName: key,
				basePath: "training/items",
			});

			uploader
				.onProgress(setUploadProgress)
				.onError((e) => {
					if (uploader.aborted) {
						return;
					}
					setUploadError(e);
					setMediaUploading(false);
				})
				.onAbort(() => {
					setUploadAborted(true);
					setMediaUploading(false);
				})
				.onComplete(({ fileKey, completionData }) => {
					if (fileKey) {
						setItem((i) => {
							i.mediaKeys = [fileKey];

							if (completionData.cloudfrontUrl) {
								i.mediaUrls = [completionData.cloudfrontUrl];
							}
						});
					}
					setUploadProgress(undefined);
					setMediaUploading(false);
				})
				.start();

			setUploader(uploader);
		},
		[setItem, item, setMediaUploading],
	);

	useEffect(() => {
		if (uploader) {
			return () => {
				uploader.abort();
			};
		}
	}, [uploader]);

	const uploadInProgress = useMemo(() => {
		return !uploadError && !uploadAborted && !!uploadProgress;
	}, [uploadProgress, uploadError, uploadAborted]);

	const hasValidTitle = useMemo(() => {
		return item.metadata?.title && item.metadata?.title.trim().length > 2;
	}, [item.metadata?.title]);

	const checkEncodingStatusMutation = useMutation({
		mutationFn: getEncodingStatusForVideo,
		onSuccess: (data) => {
			onEncodingStatus(data);
		},
		onError: (e) => {
			setAbrError(e);
			setAbrEnabled(false);
			setAbrProcessing(false);
		},
	});

	const checkEncodingStatus = (itemId: string, delay = 5000) => {
		pollingEncodingStatus.current = true;

		if (checkEncodingStatusTimeout.current) {
			clearTimeout(checkEncodingStatusTimeout.current);
		}
		checkEncodingStatusTimeout.current = setTimeout(
			() => checkEncodingStatusMutation.mutate(itemId),
			delay,
		);
	};

	const onEncodingStatus = (data: EncodingJobResponse) => {
		const errorMsg = data.error ?? "Failed to enable ABR.";

		setItem(data.item);

		if (!data.item.abrEnabled) {
			setAbrEnabled(false);
			setAbrProcessing(false);
			return;
		}

		switch (data.status) {
			case "COMPLETE":
				setAbrEnabled(true);
				setAbrProcessing(false);
				break;
			case null:
			case "CANCELED":
				setAbrProcessing(false);
				setAbrEnabled(false);
				break;
			case "ERROR":
				setAbrError(new Error(errorMsg));
				setError(errorMsg);
				setAbrProcessing(false);
				setAbrEnabled(false);
				break;
			default:
				setAbrProcessing(true);
				if (pollingEncodingStatus.current) {
					checkEncodingStatus(data.item.id);
				}
				break;
		}
	};

	const queryClient = useQueryClient();
	const toggleAbrMutation = useMutation({
		mutationFn: ({ enable, itemId }: { enable: boolean; itemId: string }) =>
			toggleABRForVideo(enable, itemId),
		onSuccess: (data) => {
			pollingEncodingStatus.current = true;
			queryClient.invalidateQueries({ queryKey: ["training-items"] });
			onEncodingStatus(data);
		},
		onError: (e) => {
			setError(
				(e as { message: string }).message ??
					(e as { toString?: () => string }).toString?.(),
			);
			setAbrError(e);
			setAbrProcessing(false);
			setAbrEnabled(false);
		},
	});

	const handleSetAbrEnabled = (enable: boolean) => {
		if (item.id) {
			setAbrError(null);
			setAbrProcessing(enable);
			toggleAbrMutation.mutate({ enable, itemId: item.id });
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: ...
	useEffect(() => {
		if (!pollingEncodingStatus.current) {
			if (!abrError && item.id) {
				setAbrEnabled((prevValue) => {
					if (!item.abrEnabled) {
						return false;
					}

					if (!prevValue) {
						setAbrProcessing(true);
						setTimeout(() => item.id && checkEncodingStatus(item.id, 0));
						return false;
					}

					setAbrProcessing(false);
					return true;
				});
			}
		}

		return () => {
			pollingEncodingStatus.current = false;

			if (checkEncodingStatusTimeout.current) {
				clearTimeout(checkEncodingStatusTimeout.current);
			}
		};
	}, [item.id]);

	const options = useMemo(
		() => [
			{
				id: MediaInputOption.UPLOAD_MEDIA,
				name: "Upload video file",
				children: (
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2">
							<label htmlFor={input.name}>
								<div
									className={classNames(
										"rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300",
										uploadInProgress || !hasValidTitle
											? "opacity-50"
											: "cursor-pointer hover:bg-gray-50",
									)}
									title={
										hasValidTitle
											? undefined
											: "Please add title of at least 3 characters"
									}
								>
									{item.mediaKeys?.length ? "Change" : "Add"}
								</div>
								<input
									type="file"
									className="sr-only"
									id={input.name}
									name={input.name}
									onChange={handleMediaUpload}
									accept="video/*"
									disabled={uploadInProgress || !hasValidTitle}
								/>
							</label>
							{uploadError ? (
								<div className="flex items-center text-red-500 gap-1 text-sm">
									<span>Error uploading video</span>
								</div>
							) : !uploadInProgress ? (
								!!item.mediaKeys?.length && (
									<div className="flex items-center text-green-500 gap-1 text-sm">
										<CheckIcon className="h-5 w-5 text-green-500" />
										<span>Video added</span>
									</div>
								)
							) : (
								<div className="flex items-center text-blue-500 gap-1 text-sm">
									{uploadProgress && uploadProgress.percentage > -1 ? (
										<span>{uploadProgress.percentage}% uploaded</span>
									) : (
										<span className="animate-pulse">Preparing...</span>
									)}
									<button
										type="button"
										onClick={() => uploader?.abort()}
										className="text-gray-500 font-semibold"
									>
										Cancel
									</button>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<Switch.Group as="div" className="flex items-center">
								<Switch
									checked={abrEnabled || abrProcessing}
									onChange={handleSetAbrEnabled}
									className={classNames(
										abrProcessing
											? "bg-secondary-600"
											: abrEnabled
											? "bg-green-500"
											: "bg-gray-200",
										"disabled:pointer-events-none disabled:opacity-75",
										"relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:ring-offset-2",
									)}
									disabled={
										!item.mediaKeys?.some((k) => k.endsWith(".mp4")) ||
										abrProcessing
									}
								>
									<span
										aria-hidden="true"
										className={classNames(
											abrProcessing || abrEnabled
												? "translate-x-5"
												: "translate-x-0",
											"pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
										)}
									>
										{abrProcessing ? (
											<ArrowPathIcon className="h-3 w-3 animate-spin text-secondary-600" />
										) : !abrEnabled ? (
											<XMarkIcon
												className={classNames(
													"h-3 w-3",
													abrError ? "text-red-500" : "text-gray-400",
												)}
											/>
										) : (
											<CheckIcon className="h-3 w-3 text-green-500" />
										)}
									</span>
								</Switch>
								<Switch.Label as="span" className="ml-3 text-sm">
									<span className="font-medium text-gray-900">ABR</span>{" "}
									<span className="text-gray-500">(Adaptive Bitrate)</span>
								</Switch.Label>
							</Switch.Group>
							<p className="text-xs italic text-gray-400">
								Enabling ABR for the first time may take a few minutes. You can
								close this dialog and check back later.
							</p>
						</div>
					</div>
				),
			},
			{
				id: MediaInputOption.SET_URL,
				name: "Set Vimeo URL",
				children: (
					<div>
						<label htmlFor="set-vimeo-url">
							<Input
								id="set-vimeo-url"
								name="set-vimeo-url"
								value={item.vimeoUrl ?? ""}
								onChange={(e) =>
									setItem((i) => ({
										...(i ?? {}),
										vimeoUrl: e.target.value,
									}))
								}
								className="w-full"
							/>
						</label>
					</div>
				),
			},
		],
		[
			item,
			setItem,
			input.name,
			uploadError,
			uploadProgress,
			handleMediaUpload,
			uploader,
			uploadInProgress,
			hasValidTitle,
			abrEnabled,
			abrProcessing,
			abrError,
			handleSetAbrEnabled,
		],
	);
	return (
		<InputRadioOptions
			options={options}
			onSelect={setMediaOptionSelected}
			defaultSelection={
				item.vimeoUrl ? MediaInputOption.SET_URL : MediaInputOption.UPLOAD_MEDIA
			}
		/>
	);
};

export default MediaInput;
