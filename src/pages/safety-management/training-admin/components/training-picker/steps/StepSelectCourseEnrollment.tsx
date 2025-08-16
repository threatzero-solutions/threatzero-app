import { ChevronRightIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { LEVEL, WRITE } from "../../../../../../constants/permissions";
import { useAuth } from "../../../../../../contexts/auth/useAuth";
import {
  CourseEnrollment,
  TrainingVisibility,
} from "../../../../../../types/entities";
import { stripHtml } from "../../../../../../utils/core";
import CourseAvailabilityDates from "../../../../../training-library/components/CourseActiveStatus";
import CourseCustomTag from "../../../../../training-library/components/CourseCustomTag";
import CourseVisibilityTag from "../../../../../training-library/components/CourseVisibilityTag";
import Step from "../components/Step";

export default function StepSelectCourseEnrollment({
  courseEnrollments,
  onSelectCourseEnrollment,
}: {
  courseEnrollments: CourseEnrollment[];
  onSelectCourseEnrollment: (courseEnrollment: CourseEnrollment) => void;
}) {
  useEffect(() => {
    if (courseEnrollments.length === 1) {
      onSelectCourseEnrollment(courseEnrollments[0]);
    }
  }, [courseEnrollments, onSelectCourseEnrollment]);

  const enrollmentBuckets = useMemo(() => {
    const buckets = {
      current: [] as CourseEnrollment[],
      past: [] as CourseEnrollment[],
      future: [] as CourseEnrollment[],
    };

    for (const enrollment of courseEnrollments
      .slice()
      .sort((a, b) => dayjs(b.startDate).diff(dayjs(a.startDate)))) {
      const startDate = dayjs(enrollment.startDate);
      const endDate = dayjs(enrollment.endDate);

      if (endDate.isBefore(dayjs())) {
        buckets.past.push(enrollment);
      } else if (startDate.isAfter(dayjs())) {
        buckets.future.push(enrollment);
      } else {
        buckets.current.push(enrollment);
      }
    }

    return buckets;
  }, [courseEnrollments]);

  if (courseEnrollments.length === 0) {
    return (
      <Step
        title="Uh oh, it looks like you don't have any course enrollments."
        subtitle={
          <span>
            You can{" "}
            <Link
              to={"/support"}
              target="_blank"
              rel="noreferrer"
              className="text-secondary-600 font-semibold"
            >
              contact support
            </Link>{" "}
            if you think this is a mistake.
          </span>
        }
        className="w-full"
      ></Step>
    );
  }

  return (
    <Step
      title="First, which course enrollment would you like to see?"
      subtitle="Choose between current, future, or past enrollments to continue."
      className="w-full"
    >
      <div className="flex flex-col gap-2 h-[24rem] overflow-y-auto border-b border-gray-200 pb-8">
        <EnrollmentList
          title="Current"
          courseEnrollments={enrollmentBuckets.current}
          onSelectCourseEnrollment={onSelectCourseEnrollment}
        />
        <EnrollmentList
          title="Future"
          courseEnrollments={enrollmentBuckets.future}
          onSelectCourseEnrollment={onSelectCourseEnrollment}
        />
        <EnrollmentList
          title="Past"
          courseEnrollments={enrollmentBuckets.past}
          onSelectCourseEnrollment={onSelectCourseEnrollment}
        />
      </div>
    </Step>
  );
}

StepSelectCourseEnrollment.StepId = "select-course-enrollment";

function EnrollmentList({
  title,
  courseEnrollments,
  onSelectCourseEnrollment,
}: {
  title: string;
  courseEnrollments: CourseEnrollment[];
  onSelectCourseEnrollment: (courseEnrollment: CourseEnrollment) => void;
}) {
  const { hasPermissions } = useAuth();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions]
  );

  const [expanded, setExpanded] = useState(courseEnrollments.length > 0);

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 line-clamp-1 hover:text-gray-700 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRightIcon className="size-4" />
        </motion.div>
        {title}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <motion.ul
              className="divide-y divide-gray-100 w-full"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {courseEnrollments.length === 0 && (
                <p className="text-sm text-gray-500 line-clamp-1 w-full text-center py-2 px-2">
                  No <span className="lowercase">{title}</span> enrollments
                  found.
                </p>
              )}
              {courseEnrollments.map((enrollment) => (
                <li
                  key={enrollment.id}
                  className="relative flex justify-between gap-x-4 px-2 py-2 sm:px-4 lg:px-6"
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
                      onClick={() => onSelectCourseEnrollment(enrollment)}
                      className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <ChevronRightIcon className="size-4" />
                      <span className="sr-only">
                        View course{" "}
                        {stripHtml(enrollment.course.metadata.title)}
                      </span>
                    </button>
                  </div>
                </li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
