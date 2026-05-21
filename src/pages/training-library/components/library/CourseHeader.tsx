import dayjs from "dayjs";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { CourseEnrollment, TrainingCourse } from "../../../../types/entities";
import { cn } from "../../../../utils/core";
import { stripHtml } from "./useLibraryCourse";

interface CourseHeaderProps {
  course: TrainingCourse;
  enrollment: CourseEnrollment | undefined | null;
  /** All of the user's enrollments, for the course switcher. */
  enrollments?: CourseEnrollment[];
  /** Switch the active course. Wired by the library page only. */
  onSelectEnrollment?: (enrollmentId: string) => void;
  /** Fallback course picker (slide-over) when there are 3+ courses. */
  onSeeOtherCourses?: () => void;
}

/** Inline segmented control — used when the user has exactly two courses. */
const CourseSwitcher: React.FC<{
  enrollments: CourseEnrollment[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}> = ({ enrollments, activeId, onSelect }) => (
  <div
    role="tablist"
    aria-label="Switch course"
    className="inline-flex max-w-full gap-0.5 overflow-hidden rounded-lg border border-gray-200 bg-warm-50 p-0.5"
  >
    {enrollments.map((e) => {
      const active = e.id === activeId;
      return (
        <button
          key={e.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => !active && onSelect(e.id)}
          className={cn(
            "truncate rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active
              ? "bg-white text-secondary-900 shadow-xs"
              : "text-secondary-500 hover:text-secondary-800",
          )}
        >
          {stripHtml(e.course?.metadata?.title) || "Course"}
        </button>
      );
    })}
  </div>
);

/**
 * Course-level header for the training library: an optional course
 * switcher, the course title + blurb, and a quiet enrollment date line.
 */
const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  enrollment,
  enrollments,
  onSelectEnrollment,
  onSeeOtherCourses,
}) => {
  const title = stripHtml(course.metadata?.title) || "Training";
  const description = stripHtml(course.metadata?.description);

  const start = enrollment?.startDate ? dayjs(enrollment.startDate) : null;
  const end = enrollment?.endDate ? dayjs(enrollment.endDate) : null;
  const dateLine =
    start?.isValid() && end?.isValid()
      ? `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`
      : null;

  const showSwitcher =
    !!onSelectEnrollment && !!enrollments && enrollments.length === 2;
  const showOtherCourses =
    !!onSeeOtherCourses && !!enrollments && enrollments.length > 2;

  return (
    <header className="mb-6">
      {showSwitcher && (
        <div className="mb-4">
          <CourseSwitcher
            enrollments={enrollments}
            activeId={enrollment?.id}
            onSelect={onSelectEnrollment}
          />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          {description && (
            <p className="mt-1 max-w-prose text-sm text-secondary-500">
              {description}
            </p>
          )}
          {dateLine && (
            <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-secondary-400">
              {dateLine}
            </p>
          )}
        </div>

        {showOtherCourses && (
          <button
            type="button"
            onClick={onSeeOtherCourses}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:border-gray-300 hover:bg-warm-50"
          >
            <ChevronUpDownIcon aria-hidden className="h-4 w-4 text-gray-400" />
            Switch course
          </button>
        )}
      </div>
    </header>
  );
};

export default CourseHeader;
