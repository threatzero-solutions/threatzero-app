/**
 * Training entitlements card on the Training tab.
 *
 * One row per course this organization has enrolled in. Each row exposes:
 *   - course identity + availability dates
 *   - an inline `<Switch>` for visibility (visible / hidden to learners)
 *   - LMS / SCORM integration tucked into a per-row disclosure so admins
 *     who don't use external LMSes don't see the chrome by default
 *
 * The whole row is one click target — opens the editor slide-over. Other
 * actions live in a kebab dropdown to avoid the "title is a button AND
 * there's an Edit link" ambiguity the legacy version had.
 *
 * Visual chrome matches the Access tab pattern: single white card with a
 * top toolbar (Add CTA on the right), divided list below, real empty state.
 */
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  AcademicCapIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toggle from "../../../components/forms/inputs/Toggle";
import Dropdown from "../../../components/layouts/Dropdown";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { useAuth } from "../../../contexts/auth/useAuth";
import { useOpenData } from "../../../hooks/use-open-data";
import {
  deleteCourseEnrollment,
  getCourseEnrollments,
  saveCourseEnrollment,
} from "../../../queries/organizations";
import {
  CourseEnrollment,
  type Organization,
  TrainingVisibility,
} from "../../../types/entities";
import { cn, stripHtml } from "../../../utils/core";
import CourseAvailabilityDates from "../../training-library/components/CourseActiveStatus";
import EditCourseEnrollment from "./EditCourseEnrollment";
import LmsIntegrationsInput from "./lms-integrations/LmsIntegrationsInput";

interface CourseEnrollmentsInputProps {
  label?: string;
  helpText?: string;
  organizationId: Organization["id"];
  accessSettings?: Organization["trainingAccessSettings"];
}

const EmptyState: React.FC<{ onAdd: () => void; canAdd: boolean }> = ({
  onAdd,
  canAdd,
}) => (
  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
      <AcademicCapIcon className="size-6" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-gray-900">
        No training enrolled yet
      </h4>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Add a course to make it available to learners in this organization. You
        can set start dates, hide it temporarily, or expose it through an
        external LMS.
      </p>
    </div>
    {canAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <PlusIcon className="size-4" />
        Add a course
      </button>
    )}
  </div>
);

const EnrollmentRow: React.FC<{
  enrollment: CourseEnrollment;
  organizationId: Organization["id"];
  accessSettings?: Organization["trainingAccessSettings"];
  isGlobalAdmin: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
}> = ({
  enrollment,
  organizationId,
  accessSettings,
  isGlobalAdmin,
  onEdit,
  onToggleVisibility,
}) => {
  const isVisible = enrollment.visibility === TrainingVisibility.VISIBLE;
  const title = stripHtml(enrollment.course?.metadata?.title) || "Untitled";
  const description = stripHtml(enrollment.course?.metadata?.description);

  return (
    <li className="group">
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
          <AcademicCapIcon className="size-5" />
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 grow text-left"
        >
          <div
            className={cn(
              "truncate text-sm font-medium",
              isVisible ? "text-gray-900" : "text-gray-400",
            )}
          >
            {title}
          </div>
          {description && (
            <div className="mt-0.5 hidden truncate text-xs text-gray-500 sm:block">
              {description}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isGlobalAdmin && enrollment.course?.metadata?.tag && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                {enrollment.course.metadata.tag}
              </span>
            )}
            {!isVisible && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                Hidden
              </span>
            )}
            <CourseAvailabilityDates
              className="text-xs"
              startDate={enrollment.startDate}
              endDate={enrollment.endDate}
              format="dates"
              showOnBlank="Start date not set"
            />
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <label
            className="flex items-center gap-2 text-xs text-gray-500"
            title={
              isVisible
                ? "Visible to learners — toggle off to hide"
                : "Hidden from learners — toggle on to show"
            }
          >
            <span className="hidden sm:inline">
              {isVisible ? "Visible" : "Hidden"}
            </span>
            <Toggle
              checked={isVisible}
              onChange={onToggleVisibility}
              aria-label={`Toggle visibility of ${title}`}
            />
          </label>
          <Dropdown
            valueIcon={<EllipsisVerticalIcon className="size-4" />}
            actions={[
              {
                id: "edit",
                value: (
                  <span className="inline-flex items-center gap-1">
                    <PencilIcon className="size-4 inline" /> Edit enrollment
                  </span>
                ),
                action: onEdit,
              },
            ]}
          />
        </div>
      </div>
      {/* LMS / SCORM integration is collapsed by default — most admins
          don't run an external LMS, and a stack of nested cards on every
          enrollment row makes the page feel busy. */}
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton className="flex w-full items-center gap-1 border-t border-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600">
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  open ? "rotate-180" : "rotate-0",
                )}
              />
              LMS &amp; SCORM integration
            </DisclosureButton>
            <DisclosurePanel className="border-t border-gray-100 bg-gray-50/40 px-4 py-3">
              <LmsIntegrationsInput
                organizationId={organizationId}
                enrollmentId={enrollment.id}
                courseId={enrollment.course?.id}
                accessSettings={accessSettings}
              />
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </li>
  );
};

const CourseEnrollmentsInput: React.FC<CourseEnrollmentsInputProps> = ({
  label,
  helpText,
  organizationId,
  accessSettings,
}) => {
  const { isGlobalAdmin } = useAuth();

  const editEnrollment = useOpenData<CourseEnrollment>();
  const { data: allCourseEnrollments } = useQuery({
    queryKey: ["course-enrollments", organizationId] as const,
    queryFn: ({ queryKey }) =>
      getCourseEnrollments(queryKey[1], { limit: 1000 }).then((r) => r.results),
  });

  const queryClient = useQueryClient();

  const { mutate: saveEnrollment } = useMutation({
    mutationFn: (data: Partial<CourseEnrollment>) =>
      saveCourseEnrollment(organizationId, data),
    onSuccess: () => {
      editEnrollment.close();
      queryClient.invalidateQueries({
        queryKey: ["course-enrollments", organizationId],
      });
    },
  });

  const { mutate: deleteEnrollment } = useMutation({
    mutationFn: (id: CourseEnrollment["id"]) =>
      deleteCourseEnrollment(organizationId, id),
    onSuccess: () => {
      editEnrollment.close();
      queryClient.invalidateQueries({
        queryKey: ["course-enrollments", organizationId],
      });
    },
  });

  const enrollments = allCourseEnrollments ?? [];
  const isEmpty = enrollments.length === 0;

  return (
    <div className="space-y-3">
      {(label || helpText) && (
        <div>
          {label && (
            <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          )}
          {helpText && (
            <p
              className="mt-1 max-w-prose text-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: helpText }}
            />
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white ring-1 ring-gray-900/5">
        {!isEmpty && (
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              {enrollments.length}{" "}
              {enrollments.length === 1 ? "course" : "courses"} enrolled
            </p>
            <button
              type="button"
              onClick={() => editEnrollment.openNew()}
              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <PlusIcon className="size-3.5" />
              Add a course
            </button>
          </div>
        )}

        {isEmpty ? (
          <EmptyState canAdd onAdd={() => editEnrollment.openNew()} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {enrollments.map((enrollment) => (
              <EnrollmentRow
                key={enrollment.id}
                enrollment={enrollment}
                organizationId={organizationId}
                accessSettings={accessSettings}
                isGlobalAdmin={isGlobalAdmin}
                onEdit={() => editEnrollment.openData(enrollment)}
                onToggleVisibility={() =>
                  saveEnrollment({
                    id: enrollment.id,
                    visibility:
                      enrollment.visibility === TrainingVisibility.VISIBLE
                        ? TrainingVisibility.HIDDEN
                        : TrainingVisibility.VISIBLE,
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>
      <SlideOver open={editEnrollment.open} setOpen={editEnrollment.setOpen}>
        <EditCourseEnrollment
          enrollment={editEnrollment.data ?? undefined}
          setOpen={editEnrollment.setOpen}
          onSave={saveEnrollment}
          onDelete={deleteEnrollment}
        />
      </SlideOver>
    </div>
  );
};

export default CourseEnrollmentsInput;
