import { useQuery } from "@tanstack/react-query";
import DataTable, {
  useDataTableFilterOptions,
} from "../../../../components/layouts/DataTable";
import { getTrainingCourses } from "../../../../queries/training";
import CourseVisibilityBadge from "../../../training-library/components/course-visibility-badge";
import OrganizationsBadges from "../../organizations/components/OrganizationsBadges";
import dayjs from "dayjs";

const TrainingCourseTable: React.FC = () => {
  const { tableFilterOptions, setTableFilterOptions } =
    useDataTableFilterOptions({
      order: { createdOn: "DESC" },
    });

  const { data: courses } = useQuery({
    queryKey: ["training-courses", tableFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingCourses(queryKey[1]),
  });

  return (
    <>
      <DataTable
        data={{
          headers: [
            { label: "Name", key: "metadataTitle" },
            { label: "Created on", key: "createdOn" },
            { label: "Visibility", key: "visibility" },
            { label: "Organizations", key: "organizations" },
          ],
          rows: (courses?.results ?? []).map((course) => ({
            id: course.id,
            metadataTitle: (
              <div className="flex flex-col gap-2">
                {course.metadata.title && (
                  <h2
                    dangerouslySetInnerHTML={{ __html: course.metadata.title }}
                    className="text-md font-semibold text-gray-700"
                  />
                )}
                {course.metadata.description && (
                  <p
                    dangerouslySetInnerHTML={{
                      __html: course.metadata.description,
                    }}
                    className="text-xs font-medium text-gray-500"
                  />
                )}
              </div>
            ),
            createdOn: dayjs(course.createdOn).format("MMM D, YYYY"),
            visibility: (
              <CourseVisibilityBadge visibility={course.visibility} />
            ),
            organizations: (
              <OrganizationsBadges
                organizations={course.organizations ?? []}
                max={3}
              />
            ),
          })),
        }}
        title="Courses"
        subtitle="View, add, or edit training courses."
        notFoundDetail="No training courses found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => {}}
          >
            + Add New Course
          </button>
        }
        orderOptions={{
          order: tableFilterOptions.order,
          setOrder: (k, v) => {
            setTableFilterOptions((options) => {
              options.order = { [k]: v };
              options.offset = 0;
            });
          },
        }}
        paginationOptions={{
          currentOffset: courses?.offset ?? 0,
          pageSize: 10,
          total: courses?.count ?? 0,
          limit: courses?.limit ?? 1,

          setOffset: (offset) =>
            setTableFilterOptions((options) => ({ ...options, offset })),
        }}
      />
    </>
  );
};

export default TrainingCourseTable;
