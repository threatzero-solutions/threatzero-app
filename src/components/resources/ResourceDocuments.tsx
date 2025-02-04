import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { Link, useLocation, useParams } from "react-router";
import {
  ResourceItem,
  ResourceItemCategory,
  ResourceType,
} from "../../types/entities";
import { useQuery } from "@tanstack/react-query";
import { getResourceItems } from "../../queries/media";
import { classNames } from "../../utils/core";

dayjs.extend(LocalizedFormat);

export const ResourceDocumentTile: React.FC<{
  document: ResourceItem;
  category?: ResourceItemCategory;
  disabled?: boolean;
}> = ({ document, category, disabled }) => {
  const location = useLocation();

  return (
    <li className="flex items-center justify-between gap-x-6 py-5">
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            {document.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="whitespace-nowrap">
            Added on{" "}
            <time dateTime={document.createdOn}>
              {dayjs(document.createdOn).format("ll")}
            </time>
          </p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <Link
          to={`/resources/${category}/${document.id}`}
          state={{ from: location }}
          className={classNames(
            "rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
            disabled ? "pointer-events-none opacity-50" : ""
          )}
        >
          View<span className="sr-only">, {document.title}</span>
        </Link>
      </div>
    </li>
  );
};

const ResourceDocuments: React.FC = () => {
  const params = useParams();
  const category = params.category as ResourceItemCategory;

  const { data: documents, isLoading } = useQuery({
    queryKey: [
      "resource-items",
      { category, type: ResourceType.DOCUMENT, limit: 250 },
    ] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {!isLoading &&
          documents?.results.map((document, idx) => (
            <ResourceDocumentTile
              key={idx}
              document={document}
              category={category}
            />
          ))}
        {isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-x-6 py-5"
            >
              <div className="min-w-0">
                <div className="animate-pulse rounded-sm bg-slate-200 h-6 w-72"></div>
                <div className="mt-1 animate-pulse rounded-sm bg-slate-200 h-4 w-20"></div>
              </div>
              <div className="animate-pulse rounded-sm bg-slate-200 h-8 w-14"></div>
            </li>
          ))}
      </ul>

      {!isLoading && !documents?.results.length && (
        <p className="text-sm font-semibold leading-6 text-gray-900">
          No documents
        </p>
      )}
    </>
  );
};

export default ResourceDocuments;
