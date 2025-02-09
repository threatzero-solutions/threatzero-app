import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { ChangeEvent, useContext, useEffect, useMemo, useState } from "react";
import { Controller, DeepPartial, useForm } from "react-hook-form";
import CourseSelect from "../../../components/forms/inputs/CourseSelect";
import DurationInput from "../../../components/forms/inputs/DurationInput";
import FormInput from "../../../components/forms/inputs/FormInput";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverFormActionButtons from "../../../components/layouts/slide-over/SlideOverFormActionButtons";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { DurationObject } from "../../../types/api";
import { CourseEnrollment, FieldType } from "../../../types/entities";
import InputRadioOptions from "../../training-library/components/edit-training-item/InputRadioOptions";

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

const asDuration = (
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
) =>
  endDate && dayjs(endDate).isValid()
    ? asLargestDuration(dayjs.duration(dayjs(endDate).diff(dayjs(startDate))))
    : undefined;

const asDate = (
  startDate: string | Date | undefined | null,
  duration: DurationObject
) => dayjs(startDate).add(dayjs.duration(duration));

interface EditCourseEnrollmentProps {
  enrollment?: DeepPartial<CourseEnrollment>;
  setOpen: (open: boolean) => void;
  onSave: (enrollment: Partial<CourseEnrollment>) => void;
  onDelete: (enrollmentId: string) => void;
}

const DEFAULT_FORMAT = "YYYY-MM-DD";

const DAYJS_DEFAULT_START_DATE = dayjs().startOf("month").add(1, "month");
const DEFAULT_START_DATE = DAYJS_DEFAULT_START_DATE.format(DEFAULT_FORMAT);
const DEFAULT_END_DATE = DAYJS_DEFAULT_START_DATE.add(1, "year").format(
  DEFAULT_FORMAT
);

const EditCourseEnrollment: React.FC<EditCourseEnrollmentProps> = ({
  enrollment: enrollmentProp,
  setOpen,
  onSave,
  onDelete,
}) => {
  const [selectedEndDateType, setSelectedEndDateType] =
    useState<string>("relative-end-date");

  const { setOpen: setConfirmationOpen, setClose: setConfirmationClose } =
    useContext(ConfirmationContext);

  const { register, getValues, setValue, watch, control } = useForm<
    Partial<CourseEnrollment>
  >({
    defaultValues: enrollmentProp ?? {
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    },
  });

  const isNew = useMemo(() => !enrollmentProp, [enrollmentProp]);
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const defaultEndDateType = useMemo(() => {
    const st = enrollmentProp?.startDate;
    const ed = enrollmentProp?.endDate;
    if (!st || !ed) {
      return "relative-end-date";
    }
    const duration = asDuration(st, ed);
    if (duration && asDate(st, duration).isSame(dayjs(ed), "day")) {
      return "relative-end-date";
    }
    return "absolute-end-date";
  }, [enrollmentProp]);

  const handleSaveEnrollment = () => {
    const enrollment = getValues();
    onSave(enrollment);
  };

  const handleDeleteEnrollment = () => {
    setConfirmationOpen({
      title: "Delete Course Enrollment",
      message: (
        <span className="grid grid-cols-1">
          <span>Are you sure you want to delete this enrollment?</span>
          <span className="font-bold mt-2">
            Upon clicking "Delete", this enrollment will be deleted, which will
            affect watch stats and viewer access.
          </span>
        </span>
      ),
      confirmText: "Delete",
      destructive: true,
      cancelText: "Go Back",
      onConfirm: () => {
        if (!enrollmentProp?.id) return;
        onDelete(enrollmentProp.id);
        setConfirmationClose();
      },
    });
  };

  useEffect(() => {
    setSelectedEndDateType(defaultEndDateType);
  }, [defaultEndDateType]);

  const handleInputSelect = (selection: string) => {
    setSelectedEndDateType(selection);
    if (selection === "relative-end-date") {
      const fromDuration = asDuration(startDate, endDate);
      fromDuration &&
        setValue(
          "endDate",
          asDate(startDate, fromDuration).format(DEFAULT_FORMAT)
        );
    }
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
                if (selectedEndDateType === "relative-end-date") {
                  // Keep existing duration when changing start date.
                  const existingDuration = asDuration(startDate, endDate);
                  existingDuration &&
                    setValue(
                      "endDate",
                      asDate(e.target.value, existingDuration).format(
                        DEFAULT_FORMAT
                      )
                    );
                } else if (dayjs(e.target.value).isAfter(dayjs(endDate))) {
                  // If not using durations, just make sure end date is always after start date.
                  setValue(
                    "endDate",
                    dayjs(e.target.value).add(1, "year").format(DEFAULT_FORMAT)
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
            defaultSelection={defaultEndDateType}
            onSelect={handleInputSelect}
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
                        value={asDuration(startDate, field.value)}
                        onChange={(duration) =>
                          field.onChange(
                            asDate(startDate, duration).format(DEFAULT_FORMAT)
                          )
                        }
                        allowedUnits={["years", "months", "days"]}
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
                        ? dayjs(startDate).add(1, "day").format(DEFAULT_FORMAT)
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
        onDelete={() => handleDeleteEnrollment()}
        submitText={isNew ? "Add" : "Update"}
        hideDelete={isNew}
      />
    </div>
  );
};

export default EditCourseEnrollment;
