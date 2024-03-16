import { TrainingSection } from "../../../types/entities";
import TrainingSectionTile from "./TrainingSectionTile";

interface TrainingSectionsProps {
	sections?: TrainingSection[];
	fallback?: React.ReactNode;
	onEditSection?: (section?: Partial<TrainingSection>) => void;
}

const TrainingSections: React.FC<TrainingSectionsProps> = ({
	sections,
	fallback,
	onEditSection,
}) => {
	return sections ? (
		<>
			<div
				role="grid"
				className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2"
			>
				{sections.map((section) => (
					<TrainingSectionTile
						key={section.id}
						section={section}
						className="shadow-xl"
						onEditSection={onEditSection}
					/>
				))}
				{!sections.length &&
					(fallback ?? <p className="text-sm text-gray-500">No content.</p>)}
			</div>
		</>
	) : (
		<div className="mt-12 w-full">
			<div className="animate-pulse flex-1">
				<div className="h-6 bg-slate-200 rounded" />
				<div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
					<div className="h-72 bg-slate-200 rounded" />
					<div className="h-72 bg-slate-200 rounded" />
				</div>
			</div>
		</div>
	);
};

export default TrainingSections;
