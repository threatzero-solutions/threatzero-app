import {
	ChangeEvent,
	useCallback,
	useMemo,
	useState,
} from "react";
import { Field, Video } from "../../../../types/entities";
import InputRadioOptions, { InputRadioOption } from "./InputRadioOptions";
import { CheckIcon } from "@heroicons/react/24/outline";
import { MediaInputOption } from "./MediaInput";
import ThumbnailCreator from "../../../../components/media/ThumbnailCreator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getPresignedPutUrl } from "../../../../queries/training";
import axios from "axios";
import { classNames } from "../../../../utils/core";
// import imageCompression from "browser-image-compression";
import { ItemUpdater } from "../../../../types/training";

export enum ThumbnailInputOption {
	UPLOAD_THUMBNAIL = "upload-thumbnail",
	CREATE_THUMBNAIL_FROM_VIDEO = "create-thumbnail-from-video",
	VIMEO_THUMBNAIL = "vimeo-thumbnail",
}

interface ThumbnailInputProps {
	item: Partial<Video>;
	input: Partial<Field> & { name: keyof Video };
	mediaOptionSelected: string;
	setItem: ItemUpdater;
}

const ThumbnailInput: React.FC<ThumbnailInputProps> = ({
	item,
	input,
	mediaOptionSelected,
	setItem,
}) => {
	const [saveProcessing, setSaveProcessing] = useState(false);

	const thumbnailKey = useMemo(() => {
		let key = item.thumbnailKey;

		if (!key && item.mediaKeys?.[0]) {
			key = `${item.mediaKeys[0].split("/")[0]}/thumbnail.png`;
		}

		return key;
	}, [item.mediaKeys?.[0], item.thumbnailKey]);

	const { data: presignedPutUrl } = useQuery({
		queryKey: ["presigned-put-url", thumbnailKey],
		// biome-ignore lint/style/noNonNullAssertion: thumbnail won't be null
		queryFn: ({ queryKey }) => getPresignedPutUrl(queryKey[1]!),
		enabled: !!thumbnailKey,
	});

	const setItemThumbnail = (thumbnail: File) => {
		const reader = new FileReader();
		reader.readAsDataURL(thumbnail);
		reader.onloadend = () => {
			setItem((i) => ({
				...i,
				thumbnailUrl: reader.result as string,
			}));
		};
	};

	const putThumbnailMutation = useMutation({
		mutationFn: async (file: File) => {
			setSaveProcessing(true);
			// const compressedFile = await imageCompression(file, {
			// 	maxWidthOrHeight: 600,
			// });

			if (presignedPutUrl) {
				await axios.create().put(presignedPutUrl, file, {
					headers: { "Content-Type": file.type },
				});
			}

			setSaveProcessing(false);
		},
		onSuccess: () => {
			setItem((i) => ({
				...i,
				thumbnailKey: thumbnailKey ?? null,
			}));
		},
	});

	const handleThumbnailUpload = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			setItemThumbnail(file);
			putThumbnailMutation.mutate(file);
		},
		[putThumbnailMutation, setItemThumbnail],
	);

	const options = useMemo(() => {
		const uploadedMediahumbnailOptions: InputRadioOption[] = [
			{
				id: ThumbnailInputOption.UPLOAD_THUMBNAIL,
				name: "Upload thumbnail file",
				children: (
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<label htmlFor={input.name}>
								<div
									className={classNames(
										"rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300",
										!thumbnailKey
											? "opacity-50"
											: "hover:bg-gray-50 cursor-pointer",
									)}
									title={
										thumbnailKey
											? undefined
											: "Please upload media before uploading a thumbnail."
									}
								>
									{item.thumbnailKey ? "Change" : "Add"}
								</div>
								<input
									type="file"
									className="sr-only"
									id={input.name}
									name={input.name}
									onChange={handleThumbnailUpload}
									disabled={!thumbnailKey}
									accept="image/*"
								/>
							</label>
							{item.thumbnailUrl && (
								<div className="flex items-center text-green-500 gap-1 text-sm">
									<CheckIcon className="h-5 w-5 text-green-400" />
									<span>Thumbnail added</span>
								</div>
							)}
						</div>
					</div>
				),
			},
			{
				id: ThumbnailInputOption.CREATE_THUMBNAIL_FROM_VIDEO,
				name: "Create thumbnail from video frame",
				children: (
					<ThumbnailCreator
						setThumbnail={setItemThumbnail}
						onSave={putThumbnailMutation.mutate}
						videoSrc={item.mediaUrls?.find((u) => /\.mp4\??/.test(u))}
						disabled={!thumbnailKey}
						saveProcessing={saveProcessing}
					/>
				),
			},
		];

		const vimeoVideoOptions: InputRadioOption[] = [
			{
				id: ThumbnailInputOption.VIMEO_THUMBNAIL,
				name: "Use thumbnail from Vimeo video",
			},
		];

		if (mediaOptionSelected === MediaInputOption.UPLOAD_MEDIA) {
			return uploadedMediahumbnailOptions;
		}

		return vimeoVideoOptions;
	}, [
		item,
		input,
		mediaOptionSelected,
		handleThumbnailUpload,
		thumbnailKey,
		putThumbnailMutation.mutate,
		saveProcessing,
		setItemThumbnail,
	]);

	return <InputRadioOptions options={options} />;
};

export default ThumbnailInput;
