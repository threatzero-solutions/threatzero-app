import { useNavigate, useParams } from "react-router-dom";
import { getTrainingSection } from "../../queries/training";
import { useQuery } from "@tanstack/react-query";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { READ } from "../../constants/permissions";
import TrainingItemTile from "./components/TrainingItemTile";
import { orderSort } from "../../utils/core";
import { useEffect } from "react";

const ViewTrainingSection: React.FC = () => {
	const { sectionId } = useParams();
	const navigate = useNavigate();

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
			navigate(url, { replace: true, state: null });
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
									__html: section.metadata.description,
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
};

export const trainingItemPermissionsOptions = {
	permissions: [READ.COURSES],
};

export default withRequirePermissions(
	ViewTrainingSection,
	trainingItemPermissionsOptions,
);
