import { Link } from "react-router";
import { FolderOpenIcon } from "@heroicons/react/20/solid";
import { trainingLibraryPermissionsOptions } from "../../../constants/permission-options";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import {
  CourseEnrollment,
  TrainingCourse,
  TrainingVisibility,
} from "../../../types/entities";
import CourseAvailabilityDates from "./CourseActiveStatus";
import CourseCustomTag from "./CourseCustomTag";
import CourseVisibilityTag from "./CourseVisibilityTag";
import FeaturedSection from "./FeaturedSection";
import TrainingSections from "./TrainingSections";

interface TrainingCourseProps {
  enrollment: CourseEnrollment | undefined | null;
  course: TrainingCourse | undefined | null;
  loading?: boolean;
  showMultipleEnrollments?: boolean;
  onSeeOtherCourses?: () => void;
  isTrainingAdmin?: boolean;
}

const ViewTrainingCourse: React.FC<TrainingCourseProps> =
  withRequirePermissions(
    ({
      enrollment,
      course,
      loading,
      showMultipleEnrollments = false,
      onSeeOtherCourses,
      isTrainingAdmin = false,
    }) => {
      return (
        <div className="flex flex-col px-5 h-full">
          {showMultipleEnrollments && course && (
            <div className="pb-5 flex items-center justify-between">
              <div className="grid">
                {onSeeOtherCourses && (
                  <button
                    type="button"
                    onClick={onSeeOtherCourses}
                    className="w-max mb-2 rounded bg-secondary-100 px-2 py-1 text-sm font-semibold text-secondary-600 shadow-sm hover:bg-secondary-200"
                  >
                    See other courses &rarr;
                  </button>
                )}
                <h1
                  className="text-2xl font-bold text-gray-900"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: dangerouslySetInnerHTML is safe
                  dangerouslySetInnerHTML={{
                    __html: course.metadata.title,
                  }}
                />
                <p
                  className="text-sm font-medium text-gray-500"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: dangerouslySetInnerHTML is safe
                  dangerouslySetInnerHTML={{
                    __html: course.metadata.description ?? "",
                  }}
                />
                <div className="flex gap-2 mt-3">
                  {isTrainingAdmin &&
                    course.visibility === TrainingVisibility.HIDDEN && (
                      <CourseVisibilityTag visibility={course.visibility} />
                    )}
                  <CourseAvailabilityDates
                    startDate={enrollment?.startDate}
                    endDate={enrollment?.endDate}
                  />
                  {isTrainingAdmin && course.metadata.tag && (
                    <CourseCustomTag tag={course.metadata.tag} />
                  )}
                </div>
              </div>
            </div>
          )}
          {!course && !loading ? (
            <div className="text-center h-full flex flex-col items-center justify-center">
              <FolderOpenIcon
                className="h-12 w-12 text-gray-400"
                aria-hidden="true"
              />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No courses available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try checking back later.
              </p>
              {isTrainingAdmin && (
                <Link
                  to="/admin-panel/organizations"
                  className="mt-4 inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                >
                  Manage Organization Course Enrollments
                </Link>
              )}
            </div>
          ) : (
            <>
              <FeaturedSection
                enrollment={enrollment}
                sections={course?.sections}
                loading={loading}
              />
              <h2 className="mt-12 text-xl text-gray-700">All Content</h2>
              <TrainingSections
                enrollment={enrollment}
                sections={course?.sections}
                loading={loading}
              />
            </>
          )}
        </div>
      );
    },
    trainingLibraryPermissionsOptions
  );

export default ViewTrainingCourse;
