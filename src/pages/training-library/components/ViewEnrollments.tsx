import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { TrainingContext } from "../../../contexts/training/training-context";
import { CourseEnrollment } from "../../../types/entities";
import { cn, stripHtml } from "../../../utils/core";
import { getCourseAvailability } from "../../../utils/training";

const availabilityLabel: Record<string, string> = {
  upcoming: "Upcoming",
  ended: "Ended",
};

const ViewEnrollments: React.FC = () => {
  const { dispatch, state, setActiveEnrollmentId } =
    useContext(TrainingContext);
  const { hasPermissions } = useAuth();
  const navigate = useNavigate();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions],
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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <SlideOverHeading
          title="My courses"
          description="Pick a course to switch to it."
          setOpen={setOpen}
        />

        <ul className="space-y-2 px-4 py-4 sm:px-6">
          {state.enrollments?.map((enrollment) => {
            const active = enrollment.id === state.activeEnrollment?.id;
            const availability = getCourseAvailability(
              enrollment.startDate,
              enrollment.endDate,
            );
            const note = availability
              ? availabilityLabel[availability]
              : undefined;
            const description = stripHtml(
              enrollment.course.metadata.description ?? "",
            );

            return (
              <li key={enrollment.id}>
                <button
                  type="button"
                  onClick={() => handleActivateCourse(enrollment.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
                    active
                      ? "border-primary-300 bg-primary-50/60"
                      : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-secondary-900">
                        {stripHtml(enrollment.course.metadata.title) ||
                          "Untitled course"}
                      </h3>
                      {active && (
                        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
                          Active
                        </span>
                      )}
                      {note && (
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-secondary-400">
                          {note}
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-secondary-500">
                        {description}
                      </p>
                    )}
                  </div>

                  {active ? (
                    <CheckCircleIcon
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-primary-600"
                    />
                  ) : (
                    <ArrowRightIcon
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-secondary-800 transition-colors hover:bg-warm-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <div className="grow" />
          {isTrainingAdmin && (
            <button
              type="button"
              onClick={() => handleManageOrganizations()}
              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Manage enrollments
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewEnrollments;
