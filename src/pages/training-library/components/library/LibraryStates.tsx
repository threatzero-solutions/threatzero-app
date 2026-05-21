import { Link } from "react-router";
import { AcademicCapIcon, FolderOpenIcon } from "@heroicons/react/24/outline";

/** Shown when the user has no course enrollment at all. */
export const LibraryEmptyState: React.FC<{ isTrainingAdmin?: boolean }> = ({
  isTrainingAdmin,
}) => (
  <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-full bg-warm-100">
      <AcademicCapIcon aria-hidden className="h-7 w-7 text-secondary-400" />
    </div>
    <h2 className="mt-4 text-lg font-semibold text-secondary-900">
      No training assigned yet
    </h2>
    <p className="mt-1.5 max-w-sm text-sm text-secondary-500">
      When your organization enrolls you in a course, it shows up here with a
      section to work through each month.
    </p>
    {isTrainingAdmin && (
      <Link
        to="/admin-panel/organizations"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        Manage course enrollments
      </Link>
    )}
  </div>
);

/** Shown when a course exists but has no sections. */
export const CourseEmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-warm-50 px-6 py-14 text-center">
    <FolderOpenIcon aria-hidden className="h-9 w-9 text-secondary-400" />
    <h2 className="mt-3 text-sm font-semibold text-secondary-900">
      This course has no content yet
    </h2>
    <p className="mt-1 max-w-xs text-sm text-secondary-500">
      Check back soon — sections will appear here once they're published.
    </p>
  </div>
);

/** Loading placeholder that mirrors the library's header + hero + list. */
export const LibrarySkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-6 space-y-2">
      <div className="h-7 w-56 rounded bg-gray-200" />
      <div className="h-3.5 w-72 rounded bg-gray-100" />
    </div>
    <div className="h-52 rounded-xl bg-gray-200" />
    <div className="mt-8 space-y-3">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="h-1.5 w-full rounded-full bg-gray-200" />
      <div className="mt-2 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[4.5rem] rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  </div>
);

/** Loading placeholder for a single section detail page. */
export const SectionSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-6 space-y-2">
      <div className="h-3 w-32 rounded bg-gray-100" />
      <div className="h-7 w-64 rounded bg-gray-200" />
      <div className="h-3.5 w-80 rounded bg-gray-100" />
    </div>
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-100" />
      ))}
    </div>
  </div>
);

/** Shown when a section can't be loaded (moved, removed, bad link). */
export const SectionNotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-warm-50 px-6 py-14 text-center">
    <FolderOpenIcon aria-hidden className="h-9 w-9 text-secondary-400" />
    <h2 className="mt-3 text-sm font-semibold text-secondary-900">
      Section not found
    </h2>
    <p className="mt-1 max-w-xs text-sm text-secondary-500">
      This training section may have been moved or removed.
    </p>
  </div>
);
