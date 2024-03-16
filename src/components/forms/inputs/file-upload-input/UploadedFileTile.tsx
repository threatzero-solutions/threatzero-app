import { XCircleIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../../../utils/core";
import { useMemo } from "react";

export interface UploadedFile {
	key?: string;
	local?: File;
	url?: string;
	uploadStatus: "uploading" | "uploaded" | "error";
}

interface UploadedFileTileProps {
	file: UploadedFile;
	readOnly?: boolean;
	deleteFile: (file: UploadedFile) => void;
}

const getThumbnailForFile = (file: UploadedFile) => {
	const fileName = file.key ?? file.local?.name ?? "";
	const ext = fileName.split(".").pop();

	switch (ext) {
		case "pdf":
			return "/img/pdf-file.svg";
		case "doc":
		case "docx":
			return "/img/doc-file.svg";
		case "txt":
		case "rtf":
			return "/img/txt-file.svg";
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "heic":
		case "heif":
			return file.local ? URL.createObjectURL(file.local) : file.url;
		case "mp3":
		case "wav":
		case "ogg":
		case "aac":
		case "mpga":
			return "/img/audio-file.svg";
		case "mp4":
		case "mov":
		case "mkv":
		case "webm":
		case "avi":
		case "flv":
		case "wmv":
		case "3gp":
		case "mpeg":
		case "m4v":
		case "mpg":
		case "qt":
			return "/img/video-file.svg";
		case "xlsx":
		case "xls":
			return "/img/table-file.svg";
		default:
			return "/img/unknown-file.svg";
	}
};

const UploadedFileTile: React.FC<UploadedFileTileProps> = ({
	file,
	readOnly,
	deleteFile,
}) => {
	const thumbnail = useMemo(() => getThumbnailForFile(file), [file]);

	return (
		<div
			className={classNames(
				"relative overflow-hidden rounded-md border border-gray-900/25 h-min",
				file.uploadStatus === "uploading" ? "opacity-70 animate-pulse" : "",
			)}
			title={file.local?.name ?? file.url}
		>
			<img
				src={thumbnail}
				alt={file.local?.name ?? file.key}
				onError={(e) => {
					console.error("Failed to load thumbnail", e);
					e.currentTarget.src = "/img/unknown-file.svg";
				}}
				className="w-full"
			/>
			{!readOnly && (
				<button
					type="button"
					className="rounded-full bg-white absolute top-1 left-1"
					onClick={() => deleteFile(file)}
				>
					<XCircleIcon
						className="h-6 w-6 text-gray-800 hover:text-gray-600 transition-colors"
						aria-hidden="true"
					/>
				</button>
			)}
			{file.url && (
				<a
					href={file.url}
					target="_blank"
					rel="noreferrer"
					className="rounded-full bg-white absolute top-1 right-1"
				>
					<ArrowDownTrayIcon
						className="h-5 w-5 m-1 text-gray-800 hover:text-gray-600 transition-colors"
						aria-hidden="true"
					/>
				</a>
			)}
		</div>
	);
};

export default UploadedFileTile;
