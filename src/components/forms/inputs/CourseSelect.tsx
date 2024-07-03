import { useImmer } from "use-immer";
import { TrainingCourse } from "../../../types/entities";
import { stripHtml } from "../../../utils/core";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useQuery } from "@tanstack/react-query";
import { getTrainingCourses } from "../../../queries/training";
import Autocomplete from "./Autocomplete";
import { useMemo } from "react";
import { LEVEL } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/AuthProvider";
import { SimpleChangeEvent } from "../../../types/core";

const displayCourse = (course?: TrainingCourse | null, admin = false) => {
  if (!course) {
    return "";
  }

  return (
    stripHtml(course.metadata.title) +
    " " +
    (admin && course.metadata.tag ? `(${course.metadata.tag})` : "")
  );
};

interface CourseSelectProps {
  value: TrainingCourse | undefined | null;
  onChange?: (
    event: SimpleChangeEvent<TrainingCourse | undefined | null>
  ) => void;
  name?: string;
  required?: boolean;
  immediate?: boolean;
  placeholder?: string;
  queryFilter?: ItemFilterQueryParams;
}

const CourseSelect: React.FC<CourseSelectProps> = ({
  value,
  onChange,
  name,
  required,
  immediate,
  placeholder,
  queryFilter,
}) => {
  const [coursesQuery, setCoursesQuery] = useImmer<ItemFilterQueryParams>({});
  const { data: allCourses } = useQuery({
    queryKey: ["training-courses", coursesQuery, queryFilter] as const,
    queryFn: ({ queryKey }) =>
      getTrainingCourses({ ...queryKey[1], ...queryFilter }),
  });

  const { hasPermissions } = useAuth();

  const isAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN]),
    [hasPermissions]
  );

  const handleCourseChange = (course: TrainingCourse | undefined | null) => {
    onChange?.({
      type: "change",
      target: {
        name: name ?? "course",
        value: course,
      },
    });
  };

  return (
    <Autocomplete
      value={value ?? null}
      onChange={handleCourseChange}
      onRemove={() => handleCourseChange(null)}
      setQuery={(s) =>
        setCoursesQuery((q) => {
          q.search = s;
        })
      }
      options={allCourses?.results ?? []}
      placeholder={placeholder ?? "Search for course..."}
      displayValue={(course) => displayCourse(course, isAdmin)}
      immediate={immediate}
      required={required}
    />
  );
};

export default CourseSelect;
