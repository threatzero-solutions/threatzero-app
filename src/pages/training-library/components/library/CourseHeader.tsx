import dayjs from "dayjs";
import {
  ArrowsRightLeftIcon,
  ChevronUpDownIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import { CourseEnrollment, TrainingCourse } from "../../../../types/entities";
import { cn } from "../../../../utils/core";
import { getCourseAvailability } from "../../../../utils/training";
import { CourseInfoPopover, CourseTagChip } from "./CourseAdminInfo";
import { splitEnrollments, stripHtml } from "./useLibraryCourse";

interface CourseHeaderProps {
  course: TrainingCourse;
  enrollment: CourseEnrollment | undefined | null;
  /** All of the user's enrollments, across every year. */
  enrollments?: CourseEnrollment[];
  /** Switch the active course directly. Wired by the library page only. */
  onSelectEnrollment?: (enrollmentId: string) => void;
  /** Open the course slide-over (the full switcher + history). */
  onSeeOtherCourses?: () => void;
  /** Surfaces admin-only course detail when a training admin is viewing. */
  isTrainingAdmin?: boolean;
}

/**
 * Course-level header for the training library: the course title, an
 * enrollment-aware switch control, a path to past enrollments, and
 * (for admins) the detail needed to tell look-alike courses apart.
 */
const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  enrollment,
  enrollments,
  onSelectEnrollment,
  onSeeOtherCourses,
  isTrainingAdmin,
}) => {
  const title = stripHtml(course.metadata?.title) || "Training";
  const description = stripHtml(course.metadata?.description);

  const start = enrollment?.startDate ? dayjs(enrollment.startDate) : null;
  const end = enrollment?.endDate ? dayjs(enrollment.endDate) : null;
  const dateLine =
    start?.isValid() && end?.isValid()
      ? `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`
      : null;

  const viewingPast =
    !!enrollment &&
    getCourseAvailability(enrollment.startDate, enrollment.endDate) === "ended";

  // The switch control keys off how many courses the user is actively
  // enrolled in. Past enrollments never count toward it — they're reached
  // through the separate history link.
  const { active, past } = splitEnrollments(enrollments);
  const otherActive = active.filter((e) => e.id !== enrollment?.id);
  const switchTarget = otherActive.length === 1 ? otherActive[0] : null;

  const showInlineSwitch =
    !!onSelectEnrollment && active.length === 2 && !!switchTarget;
  const showSwitcherButton =
    !!onSeeOtherCourses &&
    (active.length >= 3 || (active.length === 2 && !switchTarget));
  const showPastLink = !!onSeeOtherCourses && past.length > 0;

  return (
    <header className="mb-6">
      {(showInlineSwitch || showSwitcherButton || showPastLink) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {showInlineSwitch && switchTarget && (
            <button
              type="button"
              onClick={() => onSelectEnrollment(switchTarget.id)}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-secondary-700 transition-colors hover:border-gray-300 hover:bg-warm-50"
            >
              <ArrowsRightLeftIcon
                aria-hidden
                className="h-4 w-4 shrink-0 text-gray-400"
              />
              <span className="truncate">
                Switch to{" "}
                <span className="font-semibold text-secondary-900">
                  {stripHtml(switchTarget.course?.metadata?.title) ||
                    "other course"}
                </span>
              </span>
            </button>
          )}

          {showSwitcherButton && (
            <button
              type="button"
              onClick={onSeeOtherCourses}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:border-gray-300 hover:bg-warm-50"
            >
              <ChevronUpDownIcon
                aria-hidden
                className="h-4 w-4 text-gray-400"
              />
              Switch course
            </button>
          )}

          {showPastLink && (
            <button
              type="button"
              onClick={onSeeOtherCourses}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-sm font-medium text-secondary-600 underline decoration-secondary-300 underline-offset-4 transition-colors hover:bg-warm-100 hover:text-secondary-900 hover:decoration-secondary-500"
            >
              <ClockIcon aria-hidden className="h-4 w-4" />
              Past courses
            </button>
          )}
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          {viewingPast && (
            <span className="rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
              Past enrollment
            </span>
          )}
          {isTrainingAdmin && (
            <span className="flex items-center gap-2">
              <CourseTagChip tag={course.metadata?.tag} />
              <CourseInfoPopover course={course} />
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-secondary-500">
            {description}
          </p>
        )}
        {dateLine && (
          <p
            className={cn(
              "mt-1.5 text-xs font-medium uppercase tracking-wide",
              viewingPast ? "text-secondary-500" : "text-secondary-400",
            )}
          >
            {dateLine}
          </p>
        )}
      </div>
    </header>
  );
};

export default CourseHeader;
