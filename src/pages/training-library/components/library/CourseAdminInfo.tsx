import { Fragment } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { InformationCircleIcon, TagIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "motion/react";
import dayjs from "dayjs";
import { TrainingCourse, TrainingVisibility } from "../../../../types/entities";

/**
 * Admin-only course chrome for the training library. A training admin may
 * be enrolled in many look-alike courses (same title, different orgs), so
 * these surface the discriminating detail without disturbing the
 * customer-faithful view: the tag inline, everything else on demand.
 */

/** The course tag, shown inline as a small chip. Renders nothing untagged. */
export const CourseTagChip: React.FC<{ tag?: string | null }> = ({ tag }) => {
  if (!tag) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-medium text-secondary-600">
      <TagIcon aria-hidden className="h-3 w-3 text-secondary-400" />
      {tag}
    </span>
  );
};

interface InfoRow {
  label: string;
  value: string;
  mono?: boolean;
}

/** An info button whose popover lists reference detail about a course. */
export const CourseInfoPopover: React.FC<{ course: TrainingCourse }> = ({
  course,
}) => {
  const rows: InfoRow[] = [
    { label: "Tag", value: course.metadata?.tag || "—" },
    {
      label: "Visibility",
      value:
        course.visibility === TrainingVisibility.HIDDEN ? "Hidden" : "Visible",
    },
    {
      label: "Audiences",
      value: course.audiences?.map((a) => a.slug).join(", ") || "—",
    },
    { label: "Created", value: dayjs(course.createdOn).format("MMM D, YYYY") },
    {
      label: "Last updated",
      value: dayjs(course.updatedOn).format("MMM D, YYYY"),
    },
    { label: "Course ID", value: course.id, mono: true },
  ];

  return (
    <Popover as={Fragment}>
      {({ open }) => (
        <>
          <PopoverButton
            className="inline-flex cursor-pointer rounded text-secondary-400 transition-colors hover:text-secondary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            aria-label="Course details"
          >
            <InformationCircleIcon aria-hidden className="h-4 w-4" />
          </PopoverButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel
                static
                anchor="bottom start"
                as={motion.div}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="z-20 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg [--anchor-gap:6px]"
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
                  Course details
                </p>
                <dl className="space-y-1.5">
                  {rows.map((r) => (
                    <div key={r.label} className="flex gap-3 text-xs">
                      <dt className="w-24 shrink-0 text-secondary-500">
                        {r.label}
                      </dt>
                      <dd
                        className={
                          r.mono
                            ? "min-w-0 flex-1 break-all font-mono text-[10px] text-secondary-500"
                            : "min-w-0 flex-1 break-words font-medium text-secondary-800"
                        }
                      >
                        {r.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};
