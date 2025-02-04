import { useContext, useMemo } from "react";
import { CourseEnrollment, TrainingSection } from "../../../types/entities";
import TrainingSectionTile from "./TrainingSectionTile";
import { TrainingContext } from "../../../contexts/training/training-context";
import { getSectionFeaturedWindows } from "../../../utils/training";

interface TrainingSectionsProps {
  enrollment?: CourseEnrollment | null;
  sections?: TrainingSection[];
  fallback?: React.ReactNode;
  onEditSection?: (section?: Partial<TrainingSection>) => void;
  loading?: boolean;
}

const TrainingSections: React.FC<TrainingSectionsProps> = ({
  enrollment: enrollmentProp,
  sections: sectionsProp,
  fallback,
  onEditSection,
  loading: loadingProp,
}) => {
  const { state, courseLoading } = useContext(TrainingContext);

  const enrollment = useMemo(
    () => enrollmentProp ?? state.activeEnrollment,
    [enrollmentProp, state.activeEnrollment]
  );

  const sectionWindowMap = useMemo(
    () =>
      getSectionFeaturedWindows(
        enrollment,
        sectionsProp ?? state.activeCourse?.sections ?? []
      ),
    [enrollment, sectionsProp, state.activeCourse]
  );

  const sections = useMemo(
    () => Array.from(sectionWindowMap.values()).map(({ section }) => section),
    [sectionWindowMap]
  );

  const loading = useMemo(
    () => loadingProp ?? courseLoading,
    [loadingProp, courseLoading]
  );

  return sectionWindowMap && !loading ? (
    <>
      <div
        role="grid"
        className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2"
      >
        {Array.from(sectionWindowMap.values()).map(
          ({ section, window }, idx) => (
            <TrainingSectionTile
              key={section?.id ?? idx}
              section={section}
              previousSection={sections[idx - 1]}
              nextSection={sections[idx + 1]}
              featuredWindow={window}
              className="shadow-xl"
              onEditSection={onEditSection}
            />
          )
        )}
        {!sectionWindowMap.size &&
          (fallback ?? <p className="text-sm text-gray-500">No content.</p>)}
      </div>
    </>
  ) : (
    <div className="mt-12 w-full">
      <div className="animate-pulse flex-1">
        <div className="h-6 bg-slate-200 rounded-sm" />
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
          <div className="h-72 bg-slate-200 rounded-sm" />
          <div className="h-72 bg-slate-200 rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export default TrainingSections;
