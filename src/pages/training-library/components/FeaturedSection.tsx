import { useContext, useMemo } from "react";
import { CourseEnrollment, TrainingSection } from "../../../types/entities";
import { getNextAvailableSection } from "../../../utils/training";
import TrainingSectionTile from "./TrainingSectionTile";
import { Link, useLocation } from "react-router";
import { TrainingContext } from "../../../contexts/training/training-context";

interface FeaturedSectionProps {
  sections?: TrainingSection[];
  enrollment?: CourseEnrollment | null;
  loading?: boolean;
  title?: string;
  showAllTrainingLink?: boolean;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  sections: sectionsProp,
  enrollment: enrollmentProp,
  loading: loadingProp,
  title,
  showAllTrainingLink,
}) => {
  const { state, courseLoading } = useContext(TrainingContext);

  const location = useLocation();

  const enrollment = useMemo(
    () => enrollmentProp ?? state.activeEnrollment,
    [enrollmentProp, state.activeEnrollment]
  );

  const sections = useMemo(
    () => sectionsProp ?? state.activeCourse?.sections ?? [],
    [sectionsProp, state.activeCourse]
  );

  const { section: featuredSection, window } = useMemo(() => {
    return getNextAvailableSection(enrollment, sections);
  }, [enrollment, sections]);

  const loading = useMemo(
    () => loadingProp ?? courseLoading,
    [loadingProp, courseLoading]
  );

  return !loading && featuredSection ? (
    <div className="bg-linear-to-b from-gray-100 to-gray-200 rounded-lg p-4 -mx-4 shadow-xl">
      <h2 className="text-xl text-transparent w-min bg-clip-text bg-linear-to-r from-primary-400 to-primary-700 flex items-center">
        {/* <StarIcon className="h-4 w-4 mr-1" /> */}
        <span className="whitespace-nowrap">&#9733; {title ?? "Featured"}</span>
      </h2>
      <div role="grid" className="mt-3 grid grid-cols-1 gap-5 sm:gap-6">
        <TrainingSectionTile
          section={featuredSection}
          featuredWindow={window ?? undefined}
        />
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
        <div className="h-6 bg-slate-200 rounded-sm" />
        <div className="h-64 bg-slate-200 rounded-sm mt-3" />
      </div>
    </div>
  ) : (
    <p>No currently available training.</p>
  );
};

export default FeaturedSection;
