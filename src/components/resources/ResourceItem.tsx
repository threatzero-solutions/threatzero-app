import BackButton from "../layouts/BackButton";
import { useEffect } from "react";
import {
  ResourceItem as ResourceItemEntity,
  ResourceType,
} from "../../types/entities";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getResourceItem } from "../../queries/media";
import VimeoPlayer from "react-player/vimeo";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";

const VideoItem: React.FC<{ resource: ResourceItemEntity }> = ({
  resource,
}) => {
  return (
    <>
      <VimeoPlayer
        url={resource.vimeoUrl}
        controls={true}
        width="100%"
        height="unset"
        style={{
          aspectRatio: "16/9",
        }}
      />
      <h1 className="text-2xl my-1 mt-4">{resource.title}</h1>
      <p className="text-gray-500 text-md">{resource.description}</p>
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
    <div className="md:mx-0 -mx-4 md:w-full w-screen">
      <h1 className="text-2xl my-1">{resource.title}</h1>
      <p className="text-gray-500 text-md mb-4">{resource.description}</p>
      <object
        data={resource.resourceUrl}
        type="application/pdf"
        width="100%"
        height="100%"
        className="h-screen snap-start"
      >
        <a
          href={resource.resourceUrl}
          className="inline-flex items-center gap-x-2 rounded-md bg-secondary-600 cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
        >
          Download {resource.title}
          <ArrowDownTrayIcon className="-mr-0.5 h-5 w-5" aria-hidden="true" />
        </a>
      </object>
    </div>
  );
};

const ResourceItem: React.FC = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const { data: resource, isLoading } = useQuery({
    queryKey: ["resource-items", searchParams.get("category"), params.id],
    queryFn: ({ queryKey }) => getResourceItem(queryKey[2] as string),
    refetchOnWindowFocus: false,
    enabled: !!params.id,
  });

  return (
    <>
      <BackButton defaultTo={"/"} />
      {resource ? (
        <>
          {resource.type === ResourceType.VIDEO ? (
            <VideoItem resource={resource} />
          ) : (
            <DocumentItem resource={resource} />
          )}
        </>
      ) : isLoading ? (
        <div className="w-full animate-pulse bg-slate-200 rounded aspect-video" />
      ) : (
        <div>Not found.</div>
      )}
    </>
  );
};

export default ResourceItem;
