import dayjs from "dayjs";
import { useMemo } from "react";
import { classNames } from "../../../utils/core";
import { getCourseAvailability } from "../../../utils/training";

interface CourseAvailabilityDates {
  startDate: string | null | undefined | Date;
  endDate: string | null | undefined | Date;
  format?: "brief" | "dates";
  className?: string;
  showOnBlank?: boolean | string;
}

const CourseAvailabilityDates: React.FC<CourseAvailabilityDates> = ({
  startDate: startDateProp,
  endDate: endDateProp,
  format = "brief",
  className,
  showOnBlank = false,
}) => {
  const startDate = startDateProp ? dayjs(startDateProp) : null;
  const endDate = endDateProp ? dayjs(endDateProp) : null;

  const status = useMemo(() => {
    return getCourseAvailability(startDate, endDate);
  }, [startDate, endDate]);

  const text = useMemo(() => {
    if (!startDate && showOnBlank) {
      return typeof showOnBlank === "string" ? showOnBlank : "Not Started";
    }
    if (format === "brief") {
      return (
        (status === "ongoing"
          ? "Started"
          : status === "ended"
          ? "Ended"
          : "Starting") +
        " " +
        (status === "ended"
          ? endDate?.format("MMMM D, YYYY")
          : startDate?.format("MMMM D, YYYY"))
      );
    } else if (format === "dates") {
      return `${startDate?.format("MMM D, YYYY")} - ${endDate?.format(
        "MMM D, YYYY"
      )}`;
    }
  }, [status, format, startDate, endDate, showOnBlank]);

  return status || showOnBlank ? (
    <span
      className={classNames(
        "text-xs font-semibold text-white rounded px-2 py-1 w-max inline-flex items-center h-max shrink-0",
        status === "upcoming"
          ? "bg-secondary-400"
          : status === "ongoing"
          ? "bg-green-400"
          : "bg-gray-500",
        className
      )}
    >
      {text}
    </span>
  ) : (
    <></>
  );
};

export default CourseAvailabilityDates;
