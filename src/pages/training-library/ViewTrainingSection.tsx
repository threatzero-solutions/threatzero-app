import { useLocation, useNavigate, useParams } from "react-router";
import { getTrainingSection } from "../../queries/training";
import { useQuery } from "@tanstack/react-query";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import TrainingItemTile from "./components/TrainingItemTile";
import { orderSort } from "../../utils/core";
import { useEffect } from "react";
import { trainingItemPermissionsOptions } from "../../constants/permission-options";

const ViewTrainingSection: React.FC = withRequirePermissions(() => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: section } = useQuery({
    queryKey: ["traning-section", sectionId],
    queryFn: ({ queryKey }) => getTrainingSection(queryKey[1] ?? undefined),
    enabled: !!sectionId,
  });

  useEffect(() => {
    if (!section || !section.items) {
      return;
    }

    if (section.items.length === 1) {
      const url = `/training/library/items/${section.items[0].item.id}?sectionId=${section.id}`;
      navigate(url, { replace: true, state: location.state });
    }
  });

  return (
    <div>
      <BackButtonLink to={"/training/library"} />
      <div className="pt-4 pb-8 px-4 space-y-6 sm:px-6">
        {section && (
          <>
            <div>
              <h1
                className="text-2xl my-1"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                dangerouslySetInnerHTML={{ __html: section.metadata.title }}
              />
              <p
                className="text-gray-500 text-md"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
                dangerouslySetInnerHTML={{
                  __html: section.metadata.description ?? "",
                }}
              />
            </div>
            {section.items?.sort(orderSort).map((sectionItem) => (
              <TrainingItemTile
                key={sectionItem.id}
                item={sectionItem.item}
                className="shadow-lg"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}, trainingItemPermissionsOptions);

export default ViewTrainingSection;
