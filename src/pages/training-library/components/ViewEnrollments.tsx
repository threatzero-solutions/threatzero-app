import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { TrainingContext } from "../../../contexts/training/training-context";
import { CourseEnrollment, TrainingVisibility } from "../../../types/entities";
import { stripHtml } from "../../../utils/core";
import CourseAvailabilityDates from "./CourseActiveStatus";
import CourseCustomTag from "./CourseCustomTag";
import CourseVisibilityTag from "./CourseVisibilityTag";

const ViewEnrollments: React.FC = () => {
  const { dispatch, state, setActiveEnrollmentId } =
    useContext(TrainingContext);
  const { hasPermissions } = useAuth();
  const navigate = useNavigate();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions]
  );

  const setOpen = (open: boolean) =>
    dispatch({ type: "SET_VIEW_COURSES_SLIDER_OPEN", payload: open });

  const handleActivateCourse = (enrollmentId: CourseEnrollment["id"]) => {
    setActiveEnrollmentId(enrollmentId);
    navigate("/training/library/");
    setOpen(false);
  };

  const handleManageOrganizations = () => {
    navigate("/admin-panel/organizations/");
    setOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* HEADER */}
        <SlideOverHeading
          title="My Course Enrollments"
          description="Select a course to view"
          setOpen={setOpen}
        />

        {/* COURSES */}
        <ul className="divide-y divide-gray-100">
          {state.enrollments?.map((enrollment) => (
            <li
              key={enrollment.id}
              className="relative flex justify-between gap-x-6 px-4 py-5 sm:px-6 lg:px-8"
            >
              <div className="flex flex-col min-w-0 gap-y-2">
                <div className="min-w-0 flex-auto">
                  <h3
                    className="text-sm font-semibold leading-6 text-gray-900 line-clamp-1"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                    dangerouslySetInnerHTML={{
                      __html: enrollment.course.metadata.title,
                    }}
                  />
                  <p
                    className="flex text-xs leading-5 text-gray-500 line-clamp-1"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                    dangerouslySetInnerHTML={{
                      __html: enrollment.course.metadata.description ?? "",
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {isTrainingAdmin &&
                    enrollment.course.visibility ===
                      TrainingVisibility.HIDDEN && (
                      <CourseVisibilityTag
                        visibility={enrollment.course.visibility}
                      />
                    )}
                  <CourseAvailabilityDates
                    startDate={enrollment.startDate}
                    endDate={enrollment.endDate}
                  />
                  {isTrainingAdmin && enrollment.course.metadata.tag && (
                    <CourseCustomTag tag={enrollment.course.metadata.tag} />
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => handleActivateCourse(enrollment.id)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  View course
                  <span className="sr-only">
                    , {stripHtml(enrollment.course.metadata.title)}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <div className="grow" />
          {isTrainingAdmin && (
            <button
              type="button"
              onClick={() => handleManageOrganizations()}
              className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              Manage Organization Course Enrollments
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewEnrollments;
