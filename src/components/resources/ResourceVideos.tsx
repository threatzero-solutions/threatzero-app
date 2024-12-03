import { Link, useLocation, useParams } from "react-router";
import { classNames } from "../../utils/core";
import {
  ResourceItem,
  ResourceItemCategory,
  ResourceType,
} from "../../types/entities";
import { useQuery } from "@tanstack/react-query";
import { getResourceItems } from "../../queries/media";

export const ResourceVideoTile: React.FC<{
  video: ResourceItem;
  category?: ResourceItemCategory;
  disabled?: boolean;
}> = ({ video, category, disabled }) => {
  const location = useLocation();

  return (
    <li className="relative">
      <div
        className={classNames(
          "group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100",
          disabled ? "" : "cursor-pointer"
        )}
      >
        <img
          src={video.thumbnailUrl}
          alt=""
          className={classNames(
            "pointer-events-none object-cover",
            disabled ? "" : "group-hover:opacity-75"
          )}
        />
        <Link
          to={`/resources/${category}/${video.id}`}
          state={{ from: location }}
          className={classNames(
            "absolute inset-0 focus:outline-none",
            disabled ? "pointer-events-none" : ""
          )}
        >
          <span className="sr-only">View details for {video.title}</span>
        </Link>
      </div>
      <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
        {video.title}
      </p>
      <p className="pointer-events-none block text-sm font-medium text-gray-500">
        {video.description}
      </p>
    </li>
  );
};

const ResourceVideos: React.FC = () => {
  const params = useParams();
  const category = params.category as ResourceItemCategory;

  const { data: videos, isLoading } = useQuery({
    queryKey: [
      "resource-items",
      {
        category: category,
        type: ResourceType.VIDEO,
        limit: 250,
      },
    ] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 sm:gap-x-6 lg:grid-cols-2 xl:grid-cols-3 xl:gap-x-8">
        {!isLoading &&
          videos?.results.map((video, idx) => (
            <ResourceVideoTile video={video} category={category} key={idx} />
          ))}
        {isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-slate-200 rounded aspect-video"
            ></div>
          ))}
      </ul>

      {!isLoading && !videos?.results.length && (
        <p className="text-sm font-semibold leading-6 text-gray-900">
          No videos
        </p>
      )}
    </>
  );
};

export default ResourceVideos;
