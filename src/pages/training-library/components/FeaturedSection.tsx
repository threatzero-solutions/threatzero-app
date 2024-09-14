import { useMemo } from "react";
import { TrainingSection } from "../../../types/entities";
import { getAvailableSection } from "../../../utils/training";
import TrainingSectionTile from "./TrainingSectionTile";
import { Link, useLocation } from "react-router-dom";

interface FeaturedSectionProps {
  sections?: TrainingSection[];
  loading?: boolean;
  title?: string;
  showAllTrainingLink?: boolean;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  sections,
  loading,
  title,
  showAllTrainingLink,
}) => {
  const location = useLocation();
  const featuredSection = useMemo(() => {
    if (!sections?.length) {
      return;
    }

    const currentSection = getAvailableSection(sections);

    return currentSection ?? sections[0];
  }, [sections]);

  return !loading && featuredSection ? (
    <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4 -mx-4 shadow-xl">
      <h2 className="text-xl text-transparent w-min bg-clip-text bg-gradient-to-r from-primary-400 to-primary-700 flex items-center">
        {/* <StarIcon className="h-4 w-4 mr-1" /> */}
        <span className="whitespace-nowrap">&#9733; {title ?? "Featured"}</span>
      </h2>
      <div role="grid" className="mt-3 grid grid-cols-1 gap-5 sm:gap-6">
        <TrainingSectionTile section={featuredSection} />
      </div>
      {showAllTrainingLink && (
        <Link to="/training/library" state={{ from: location }}>
          <p className="text-sm text-gray-600 mt-3">View all training &rarr;</p>
        </Link>
      )}
    </div>
  ) : loading ? (
    <div className="w-full">
      <div className="animate-pulse flex-1">
        <div className="h-6 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded mt-3" />
      </div>
    </div>
  ) : (
    <p>No currently available training.</p>
  );
};

export default FeaturedSection;
