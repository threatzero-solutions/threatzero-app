import dayjs from "dayjs";
import { useMemo } from "react";
import { classNames } from "../../../utils/core";

const CourseActiveStatus: React.FC<{
  startDate: string | null | undefined | Date;
  endDate: string | null | undefined | Date;
}> = ({ startDate: startDateProp, endDate: endDateProp }) => {
  const startDate = startDateProp ? dayjs(startDateProp) : null;
  const endDate = endDateProp ? dayjs(endDateProp) : null;

  const status = useMemo(() => {
    if (startDate) {
      if (startDate.isAfter(dayjs())) {
        return "upcoming";
      } else if (endDate && endDate.isBefore(dayjs())) {
        return "ended";
      } else {
        return "ongoing";
      }
    }

    return null;
  }, [startDate, endDate]);

  return status ? (
    <span
      className={classNames(
        "text-xs font-semibold text-white rounded px-2 py-1 w-max inline-flex items-center h-max shrink-0",
        status === "upcoming"
          ? "bg-secondary-400"
          : status === "ongoing"
          ? "bg-green-400"
          : status === "ended"
          ? "bg-gray-500"
          : ""
      )}
    >
      {status === "ongoing"
        ? "Began"
        : status === "ended"
        ? "Ended"
        : "Starting"}{" "}
      {status === "ended"
        ? endDate?.format("MMMM D, YYYY")
        : startDate?.format("MMMM D, YYYY")}
    </span>
  ) : (
    <></>
  );
};

export default CourseActiveStatus;
