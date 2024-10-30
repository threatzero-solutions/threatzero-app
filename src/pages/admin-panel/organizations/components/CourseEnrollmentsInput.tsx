import { useState } from "react";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import {
  CourseEnrollment,
  TrainingVisibility,
} from "../../../../types/entities";
import CourseAvailabilityDates from "../../../training-library/components/CourseActiveStatus";
import { classNames, stripHtml } from "../../../../utils/core";
import EditCourseEnrollment from "./EditCourseEnrollment";
import { useFormContext, useFieldArray, DeepPartial } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";

interface CourseEnrollmentsInputProps {
  name: string;
}

const CourseEnrollmentsInput: React.FC<CourseEnrollmentsInputProps> = ({
  name,
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
      <div className="flex flex-col gap-2">
        {fields.map((enrollment, index) => (
          <div
            className="flex shadow-sm rounded-md ring-1 ring-inset ring-gray-300 py-4 px-6"
            key={enrollment.keyId}
          >
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
            <div
              className={classNames(
                "self-center inline-flex gap-1 items-center text-xs font-semibold text-white rounded px-2 py-1 w-max transition-colors cursor-pointer",
                enrollment.visibility === TrainingVisibility.VISIBLE
                  ? "bg-secondary-500 hover:bg-secondary-600"
                  : "bg-purple-500 hover:bg-purple-600"
              )}
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
            >
              {enrollment.visibility === TrainingVisibility.VISIBLE ? (
                <EyeIcon className="h-5 w-5" />
              ) : (
                <EyeSlashIcon className="h-5 w-5" />
              )}
              {enrollment.visibility === TrainingVisibility.VISIBLE
                ? "Visible"
                : "Hidden"}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleEditEnrollment()}
          className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Enroll In New Course
        </button>
      </div>
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
