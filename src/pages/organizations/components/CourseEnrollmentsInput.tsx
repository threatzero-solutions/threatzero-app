import {
  ArrowRightEndOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormField from "../../../components/forms/FormField";
import ButtonGroup from "../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../components/layouts/buttons/IconButton";
import Block from "../../../components/layouts/content/Block";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
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
import { classNames, stripHtml } from "../../../utils/core";
import CourseAvailabilityDates from "../../training-library/components/CourseActiveStatus";
import EditCourseEnrollment from "./EditCourseEnrollment";
import LmsIntegrationsInput from "./lms-integrations/LmsIntegrationsInput";

interface CourseEnrollmentsInputProps {
  name: string;
  label?: string;
  helpText?: string;
  organizationId: Organization["id"];
  accessSettings?: Organization["trainingAccessSettings"];
}

const CourseEnrollmentsInput: React.FC<CourseEnrollmentsInputProps> = ({
  name,
  label,
  helpText,
  organizationId,
  accessSettings,
}) => {
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

  return (
    <>
      <FormField
        field={{
          name,
          label,
          helpText,
        }}
        helpTextFirst
        action={
          <IconButton
            icon={ArrowRightEndOnRectangleIcon}
            className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
            text="Enroll in New Course"
            type="button"
            onClick={() => editEnrollment.openNew()}
          />
        }
        input={
          <div className="flex flex-col gap-2">
            {(allCourseEnrollments || []).map((enrollment) => (
              <Block
                className="flex flex-col gap-4 bg-gray-50"
                key={enrollment.id}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2 grow">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className="w-max cursor-pointer text-gray-900 hover:text-gray-600 transition-colors"
                        onClick={() => editEnrollment.openData(enrollment)}
                      >
                        <span className="text-sm font-semibold">
                          {stripHtml(enrollment.course?.metadata?.title)}
                        </span>{" "}
                        <span className="text-xs">(edit)</span>
                      </button>
                      <span className="text-xs text-gray-500">
                        {stripHtml(enrollment.course?.metadata?.description)}
                      </span>
                    </div>
                    <CourseAvailabilityDates
                      startDate={enrollment.startDate}
                      endDate={enrollment.endDate}
                      format="dates"
                      showOnBlank="Start date is blank"
                    />
                  </div>
                  <ButtonGroup>
                    <IconButton
                      icon={
                        enrollment.visibility === TrainingVisibility.VISIBLE
                          ? EyeIcon
                          : EyeSlashIcon
                      }
                      className={classNames(
                        "text-white",
                        enrollment.visibility === TrainingVisibility.VISIBLE
                          ? "bg-secondary-500 hover:bg-secondary-600"
                          : "bg-purple-500 hover:bg-purple-600"
                      )}
                      text={
                        enrollment.visibility === TrainingVisibility.VISIBLE
                          ? "Visible"
                          : "Hidden"
                      }
                      type="button"
                      title={
                        enrollment.visibility === TrainingVisibility.VISIBLE
                          ? "Click to hide"
                          : "Click to make visible"
                      }
                      onClick={() =>
                        saveEnrollment({
                          id: enrollment.id,
                          visibility:
                            enrollment.visibility === TrainingVisibility.VISIBLE
                              ? TrainingVisibility.HIDDEN
                              : TrainingVisibility.VISIBLE,
                        })
                      }
                    />
                  </ButtonGroup>
                </div>
                <LmsIntegrationsInput
                  organizationId={organizationId}
                  enrollmentId={enrollment.id}
                  courseId={enrollment.course?.id}
                  accessSettings={accessSettings}
                />
              </Block>
            ))}
          </div>
        }
      />
      <SlideOver open={editEnrollment.open} setOpen={editEnrollment.setOpen}>
        <EditCourseEnrollment
          enrollment={editEnrollment.data ?? undefined}
          setOpen={editEnrollment.setOpen}
          onSave={saveEnrollment}
          onDelete={deleteEnrollment}
        />
      </SlideOver>
    </>
  );
};

export default CourseEnrollmentsInput;
