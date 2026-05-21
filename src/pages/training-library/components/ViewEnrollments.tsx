import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { TrainingContext } from "../../../contexts/training/training-context";
import { CourseEnrollment } from "../../../types/entities";
import { cn, stripHtml } from "../../../utils/core";
import { getCourseAvailability } from "../../../utils/training";
import { CourseTagChip } from "./library/CourseAdminInfo";
import { splitEnrollments } from "./library/useLibraryCourse";

interface EnrollmentRowProps {
  enrollment: CourseEnrollment;
  selected: boolean;
  isPast: boolean;
  isAdmin: boolean;
  onSelect: () => void;
}

const EnrollmentRow: React.FC<EnrollmentRowProps> = ({
  enrollment,
  selected,
  isPast,
  isAdmin,
  onSelect,
}) => {
  const availability = getCourseAvailability(
    enrollment.startDate,
    enrollment.endDate,
  );
  const note = isPast
    ? enrollment.endDate
      ? `Ended ${dayjs(enrollment.endDate).format("MMM D, YYYY")}`
      : "Ended"
    : availability === "upcoming"
      ? enrollment.startDate
        ? `Starts ${dayjs(enrollment.startDate).format("MMM D, YYYY")}`
        : "Upcoming"
      : null;

  const description = stripHtml(enrollment.course.metadata.description ?? "");

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
          selected
            ? "border-primary-300 bg-primary-50/60"
            : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                isPast ? "text-secondary-600" : "text-secondary-900",
              )}
            >
              {stripHtml(enrollment.course.metadata.title) || "Untitled course"}
            </h3>
            {isAdmin && <CourseTagChip tag={enrollment.course.metadata.tag} />}
            {note && (
              <span className="text-[11px] font-medium uppercase tracking-wide text-secondary-400">
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

        {selected ? (
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

  const { active, past } = useMemo(
    () => splitEnrollments(state.enrollments),
    [state.enrollments],
  );
  const showHeadings = active.length > 0 && past.length > 0;

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

  const renderRow = (enrollment: CourseEnrollment, isPast: boolean) => (
    <EnrollmentRow
      key={enrollment.id}
      enrollment={enrollment}
      selected={enrollment.id === state.activeEnrollment?.id}
      isPast={isPast}
      isAdmin={isTrainingAdmin}
      onSelect={() => handleActivateCourse(enrollment.id)}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <SlideOverHeading
          title="My courses"
          description="Pick a course to switch to it."
          setOpen={setOpen}
        />

        <div className="space-y-5 px-4 py-4 sm:px-6">
          {active.length > 0 && (
            <section>
              {showHeadings && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                  Active courses
                </h3>
              )}
              <ul className="space-y-2">
                {active.map((e) => renderRow(e, false))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section>
              {showHeadings && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                  Past courses
                </h3>
              )}
              <ul className="space-y-2">
                {past.map((e) => renderRow(e, true))}
              </ul>
            </section>
          )}

          {active.length === 0 && past.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-secondary-500">
              You aren't enrolled in any courses yet.
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-secondary-800 transition-colors hover:bg-warm-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <div className="grow" />
          {isTrainingAdmin && (
            <button
              type="button"
              onClick={() => handleManageOrganizations()}
              className="inline-flex cursor-pointer justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
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
