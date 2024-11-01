import { useState } from "react";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import {
  CourseEnrollment,
  type Organization,
  TrainingVisibility,
} from "../../../../types/entities";
import CourseAvailabilityDates from "../../../training-library/components/CourseActiveStatus";
import { classNames, stripHtml } from "../../../../utils/core";
import EditCourseEnrollment from "./EditCourseEnrollment";
import { useFormContext, useFieldArray, DeepPartial } from "react-hook-form";
import {
  ArrowRightEndOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/20/solid";
import FormField from "../../../../components/forms/FormField";
import Block from "../../../../components/layouts/content/Block";
import ButtonGroup from "../../../../components/layouts/buttons/ButtonGroup";
import IconButton from "../../../../components/layouts/buttons/IconButton";
import LmsIntegrationsInput from "./lms-integrations/LmsIntegrationsInput";

interface CourseEnrollmentsInputProps {
  name: string;
  label?: string;
  helpText?: string;
  organizationId: Organization["id"];
}

const CourseEnrollmentsInput: React.FC<CourseEnrollmentsInputProps> = ({
  name,
  label = "Course Enrollments",
  helpText,
  organizationId,
}) => {
  const [editCourseEnrollmentSliderOpen, setEditCourseEnrollmentSliderOpen] =
    useState(false);
  const [activeCourseEnrollmentIdx, setActiveCourseEnrollmentIdx] = useState<
    number | undefined
  >();

  const { watch, control } = useFormContext<{
    [key: string]: DeepPartial<CourseEnrollment>[];
  }>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name,
    keyName: "keyId",
  });

  const activeEnrollment =
    activeCourseEnrollmentIdx !== undefined
      ? watch(`${name}.${activeCourseEnrollmentIdx}`)
      : undefined;

  const handleEditEnrollment = (idx?: number) => {
    setActiveCourseEnrollmentIdx(idx);
    setEditCourseEnrollmentSliderOpen(true);
  };

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
            onClick={() => handleEditEnrollment()}
          />
        }
        input={
          <div className="flex flex-col gap-2">
            {fields.map((enrollment, index) => (
              <Block
                className="flex flex-col gap-4 bg-gray-50"
                key={enrollment.keyId}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2 grow">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className="w-max cursor-pointer text-gray-900 hover:text-gray-600 transition-colors"
                        onClick={() => handleEditEnrollment(index)}
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
                        update(index, {
                          ...enrollment,
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
                />
              </Block>
            ))}
          </div>
        }
      />
      <SlideOver
        open={editCourseEnrollmentSliderOpen}
        setOpen={setEditCourseEnrollmentSliderOpen}
      >
        <EditCourseEnrollment
          enrollment={activeEnrollment}
          setOpen={setEditCourseEnrollmentSliderOpen}
          index={activeCourseEnrollmentIdx}
          onAdd={append}
          onUpdate={update}
          onRemove={remove}
        />
      </SlideOver>
    </>
  );
};

export default CourseEnrollmentsInput;
