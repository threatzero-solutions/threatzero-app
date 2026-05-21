import { trainingLibraryPermissionsOptions } from "../../../constants/permission-options";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import { CourseEnrollment, TrainingCourse } from "../../../types/entities";
import CourseHeader from "./library/CourseHeader";
import CourseSections from "./library/CourseSections";
import FocusedSectionPanel from "./library/FocusedSectionPanel";
import {
  CourseEmptyState,
  LibraryEmptyState,
  LibrarySkeleton,
} from "./library/LibraryStates";
import { useLibraryCourse } from "./library/useLibraryCourse";

interface TrainingCourseProps {
  enrollment: CourseEnrollment | undefined | null;
  course: TrainingCourse | undefined | null;
  loading?: boolean;
  isTrainingAdmin?: boolean;
  /** All of the user's enrollments — drives the course switcher. */
  enrollments?: CourseEnrollment[];
  /** Switch the active course; supplied by the library page only. */
  onSelectEnrollment?: (enrollmentId: string) => void;
  /** Open the course slide-over (used when there are 3+ courses). */
  onSeeOtherCourses?: () => void;
}

/**
 * The end-user training library: a guided course shown as a focused
 * "next section" spotlight plus the full course as a vertical timeline.
 * Also serves the admin course preview (read-only — no editing controls).
 */
const ViewTrainingCourse: React.FC<TrainingCourseProps> =
  withRequirePermissions(
    ({
      enrollment,
      course,
      loading,
      isTrainingAdmin = false,
      enrollments,
      onSelectEnrollment,
      onSeeOtherCourses,
    }) => {
      const { rows, focused, completeCount, totalCount } = useLibraryCourse(
        course,
        enrollment,
      );

      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {loading ? (
            <LibrarySkeleton />
          ) : !course ? (
            <LibraryEmptyState isTrainingAdmin={isTrainingAdmin} />
          ) : (
            <>
              <CourseHeader
                course={course}
                enrollment={enrollment}
                enrollments={enrollments}
                onSelectEnrollment={onSelectEnrollment}
                onSeeOtherCourses={onSeeOtherCourses}
                isTrainingAdmin={isTrainingAdmin}
              />
              {rows.length === 0 || !focused ? (
                <CourseEmptyState />
              ) : (
                <>
                  <FocusedSectionPanel row={focused} />
                  <CourseSections
                    rows={rows}
                    completeCount={completeCount}
                    totalCount={totalCount}
                  />
                </>
              )}
            </>
          )}
        </div>
      );
    },
    trainingLibraryPermissionsOptions,
  );

export default ViewTrainingCourse;
