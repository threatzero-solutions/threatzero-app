import BackButton from "../layouts/BackButton";
import { useEffect } from "react";
import {
	ResourceItem as ResourceItemEntity,
	ResourceType,
} from "../../types/entities";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getResourceItem } from "../../queries/media";
import ReactPlayer from "react-player/lazy";

const VideoItem: React.FC<{ resource: ResourceItemEntity }> = ({
	resource,
}) => {
	return (
		<>
			<ReactPlayer
				url={resource.resourceUrl}
				controls={true}
				width="100%"
				height="unset"
				style={{
					aspectRatio: "16/9",
				}}
			/>
		</>
	);
};

const DocumentItem: React.FC<{ resource: ResourceItemEntity }> = ({
	resource,
}) => {
	useEffect(() => {
		document.querySelector("html")?.classList.add("snap-y-proximity");

		return () => {
			document.querySelector("html")?.classList.remove("snap-y-proximity");
		};
	}, []);

	return (
		<div className="h-screen snap-start md:mx-0 -mx-4 md:w-full w-screen">
			{/* <iframe
				id="pdf-js-viewer"
				title={resource.title}
				src={
					"/js/pdfjs-4.0.269-dist/web/viewer.html?file=" +
					encodeURIComponent(resource.resourceUrl)
				}
				width="100%"
				height="100%"
			/> */}
			<a href="{resource.resourceUrl}">Download {resource.title}</a>
		</div>
	);
};

const ResourceItem: React.FC = () => {
	const params = useParams();
	const [searchParams] = useSearchParams();

	const { data: resource } = useQuery({
		queryKey: ["resource-items", searchParams.get("category"), params.id],
		queryFn: ({ queryKey }) => getResourceItem(queryKey[2] as string),
		refetchOnWindowFocus: false,
		enabled: !!params.id,
	});

	return (
		<>
			<BackButton />
			{resource ? (
				<>
					{resource.type === ResourceType.VIDEO ? (
						<VideoItem resource={resource} />
					) : (
						<DocumentItem resource={resource} />
					)}
				</>
			) : (
				<div>Not found.</div>
			)}
		</>
	);
};

export default ResourceItem;
