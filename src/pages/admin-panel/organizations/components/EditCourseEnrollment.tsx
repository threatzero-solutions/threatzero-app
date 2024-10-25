import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import { CourseEnrollment, FieldType } from "../../../../types/entities";
import { ChangeEvent, useMemo } from "react";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import FormInput from "../../../../components/forms/inputs/FormInput";
import dayjs from "dayjs";
import CourseSelect from "../../../../components/forms/inputs/CourseSelect";
import SlideOverFormActionButtons from "../../../../components/layouts/slide-over/SlideOverFormActionButtons";
import { Controller, DeepPartial, useForm } from "react-hook-form";
import InputRadioOptions from "../../../training-library/components/edit-training-item/InputRadioOptions";
import DurationInput from "../../../../components/forms/inputs/DurationInput";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const asLargestDuration = (duration: duration.Duration) => {
  const keys: duration.DurationUnitType[] = ["years", "months", "days"];
  for (const key of keys) {
    const value = duration.get(key);
    if (value > 0) {
      return { [key]: value };
    }
  }
  return { days: 1 };
};

interface EditCourseEnrollmentProps {
  enrollment?: DeepPartial<CourseEnrollment>;
  setOpen: (open: boolean) => void;
  index?: number;
  onAdd: (enrollment: DeepPartial<CourseEnrollment>) => void;
  onUpdate: (idx: number, enrollment: DeepPartial<CourseEnrollment>) => void;
  onRemove: (idx?: number) => void;
}

const DEFAULT_START_DATE = dayjs().startOf("year").format("YYYY-MM-DD");
const DEFAULT_END_DATE = dayjs()
  .startOf("year")
  .add(1, "year")
  .format("YYYY-MM-DD");

const EditCourseEnrollment: React.FC<EditCourseEnrollmentProps> = ({
  enrollment: enrollmentProp,
  setOpen,
  index,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const { register, getValues, setValue, watch, control } = useForm({
    defaultValues: enrollmentProp ?? {
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    },
  });

  const isNew = useMemo(() => !enrollmentProp, [enrollmentProp]);
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const handleSaveEnrollment = () => {
    const enrollment = getValues();
    if (index === undefined) {
      onAdd(enrollment);
    } else {
      onUpdate(index, enrollment);
    }
    setOpen(false);
  };

  const handleRemoveEnrollment = () => {
    onRemove(index);
    setOpen(false);
  };

  return (
    <div className="flex h-screen flex-col">
      <SlideOverHeading
        title={!isNew ? "Edit Course Enrollment" : "Add Course Enrollment"}
        description={`This enrollment grants the organization access to the following course.`}
        setOpen={setOpen}
      ></SlideOverHeading>
      <SlideOverFormBody>
        <SlideOverField
          label="Training Course"
          name="course"
          helpText="The organization will be enrolled in this course."
        >
          <Controller
            control={control}
            name="course"
            render={({ field }) => (
              <CourseSelect
                value={field.value}
                onChange={(e) => field.onChange(e.target?.value)}
                immediate
                required
              />
            )}
          />
        </SlideOverField>
        <SlideOverField
          label="Start Date"
          name="startDate"
          helpText="The start date of the enrollment."
        >
          <FormInput
            {...register("startDate", {
              onChange: (e: ChangeEvent<HTMLInputElement>) => {
                if (dayjs(e.target.value).isAfter(dayjs(endDate))) {
                  setValue(
                    "endDate",
                    dayjs(e.target.value).add(1, "year").format("YYYY-MM-DD")
                  );
                }
              },
            })}
            field={{
              type: FieldType.DATE,
            }}
            required
          />
        </SlideOverField>
        <SlideOverField
          label="End Date"
          name="endDate"
          helpText="The end date of the enrollment."
        >
          <InputRadioOptions
            hideOnInactive
            options={[
              {
                id: "relative-end-date",
                name: "Relative",
                children: (
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <DurationInput
                        value={
                          field.value && dayjs(field.value).isValid()
                            ? asLargestDuration(
                                dayjs.duration(
                                  dayjs(field.value).diff(dayjs(startDate))
                                )
                              )
                            : undefined
                        }
                        onChange={(duration) =>
                          field.onChange(
                            dayjs(startDate)
                              .add(dayjs.duration(duration))
                              .format("YYYY-MM-DD")
                          )
                        }
                      />
                    )}
                  />
                ),
              },
              {
                id: "absolute-end-date",
                name: "Absolute",
                children: (
                  <FormInput
                    {...register("endDate")}
                    min={
                      dayjs(startDate).isValid()
                        ? dayjs(startDate).add(1, "day").format("YYYY-MM-DD")
                        : undefined
                    }
                    field={{
                      type: FieldType.DATE,
                    }}
                    required
                  />
                ),
              },
            ]}
          />
        </SlideOverField>
      </SlideOverFormBody>
      <SlideOverFormActionButtons
        onDone={() => handleSaveEnrollment()}
        onClose={() => setOpen(false)}
        onDelete={() => handleRemoveEnrollment()}
        submitText={isNew ? "Add" : "Update"}
        hideDelete={isNew}
        deleteText="Remove"
      />
    </div>
  );
};

export default EditCourseEnrollment;
