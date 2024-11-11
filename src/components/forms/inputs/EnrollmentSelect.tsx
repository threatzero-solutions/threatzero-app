import { useImmer } from "use-immer";
import { CourseEnrollment } from "../../../types/entities";
import { stripHtml } from "../../../utils/core";
import { useQuery } from "@tanstack/react-query";
import { getMyCourseEnrollments } from "../../../queries/training";
import Autocomplete from "./Autocomplete";
import { useMemo } from "react";
import { LEVEL } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { SimpleChangeEvent } from "../../../types/core";
import { DeepPartial } from "react-hook-form";
import { getCourseEnrollments } from "../../../queries/organizations";

type EnrollmentInput =
  | CourseEnrollment
  | DeepPartial<CourseEnrollment>
  | undefined
  | null;

const displayCourse = (enrollment?: EnrollmentInput, admin = false) => {
  if (!enrollment?.course) {
    return "";
  }

  return (
    stripHtml(enrollment.course.metadata?.title) +
    " " +
    (admin && enrollment.course.metadata?.tag
      ? `(${enrollment.course.metadata.tag})`
      : "")
  );
};

interface EnrollmentSelectProps {
  value: EnrollmentInput;
  onChange?: (event: SimpleChangeEvent<EnrollmentInput>) => void;
  name?: string;
  required?: boolean;
  immediate?: boolean;
  disabled?: boolean;
  placeholder?: string;
  organizationId?: string;
}

const EnrollmentSelect: React.FC<EnrollmentSelectProps> = ({
  value,
  onChange,
  name,
  required,
  immediate,
  disabled = false,
  placeholder,
  organizationId,
}) => {
  const { data: allCourseEnrollments } = useQuery({
    queryKey: [
      organizationId ? "course-enrollments" : "my-course-enrollments",
      organizationId,
    ] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1]
        ? getCourseEnrollments(queryKey[1])
        : getMyCourseEnrollments(),
  });

  const [query, setQuery] = useImmer<string>("");
  const filteredEnrollments = useMemo(() => {
    if (!query) {
      return allCourseEnrollments;
    }
    return allCourseEnrollments?.filter((enrollment) =>
      enrollment.course?.metadata?.title
        ?.toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [query, allCourseEnrollments]);

  const { hasPermissions } = useAuth();

  const isAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN]),
    [hasPermissions]
  );

  const handleChange = (course: EnrollmentInput) => {
    onChange?.({
      type: "change",
      target: {
        name: name ?? "enrollment",
        value: course,
      },
    });
  };

  return (
    <Autocomplete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value={value ?? (null as any)}
      onChange={handleChange}
      onRemove={() => handleChange(null)}
      setQuery={setQuery}
      options={filteredEnrollments ?? []}
      placeholder={placeholder ?? "Search for course enrollment..."}
      displayValue={(enrollment) => displayCourse(enrollment, isAdmin)}
      immediate={immediate}
      required={required}
      disabled={disabled}
    />
  );
};

export default EnrollmentSelect;
