import { TrainingVisibility } from "../../../types/entities";
import { Link } from "react-router-dom";
import CourseCustomTag from "../../training-library/components/CourseCustomTag";
import CourseVisibilityTag from "../../training-library/components/CourseVisibilityTag";
import { useQuery } from "@tanstack/react-query";
import { getTrainingCourses } from "../../../queries/training";
import DataTable from "../../../components/layouts/DataTable";
import { DocumentDuplicateIcon } from "@heroicons/react/20/solid";
import { PencilSquareIcon } from "@heroicons/react/20/solid";
import { EyeIcon } from "@heroicons/react/20/solid";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { useDebounceValue } from "usehooks-ts";

const ViewCourses: React.FC = () => {
  const [courseFilterOptions, setCourseFilterOptions] =
    useImmer<ItemFilterQueryParams>({});
  const [debouncedCourseFilterOptions] = useDebounceValue(
    courseFilterOptions,
    300
  );
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["training-courses", debouncedCourseFilterOptions] as const,
    queryFn: ({ queryKey }) => getTrainingCourses(queryKey[1]),
  });

  return (
    <>
      <DataTable
        title="All Courses"
        subtitle="Organizations can be enrolled in any number of these courses to access their training content."
        isLoading={coursesLoading}
        data={{
          headers: [
            {
              label: "Title",
              key: "title",
            },
            {
              label: <span className="sr-only">Actions</span>,
              key: "actions",
              align: "right",
              noSort: true,
            },
          ],
          rows: (courses?.results ?? []).map((course) => ({
            id: course.id,
            title: (
              <div className="flex flex-col min-w-0 gap-y-2">
                <div className="min-w-0 flex-auto">
                  <h3
                    className="text-sm font-semibold leading-6 text-gray-900 line-clamp-1"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                    dangerouslySetInnerHTML={{
                      __html: course.metadata.title,
                    }}
                  />
                  <p
                    className="flex text-xs leading-5 text-gray-500 line-clamp-1"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                    dangerouslySetInnerHTML={{
                      __html: course.metadata.description ?? "",
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {course.visibility === TrainingVisibility.HIDDEN && (
                    <CourseVisibilityTag visibility={course.visibility} />
                  )}
                  {course.metadata.tag && (
                    <CourseCustomTag tag={course.metadata.tag} />
                  )}
                </div>
              </div>
            ),
            actions: (
              <div className="flex items-center w-full justify-end gap-2">
                <Link
                  to={`preview/${course.id}`}
                  className="flex gap-1 items-center w-max rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  Preview
                  <span className="sr-only">
                    Preview {course.metadata.title}
                  </span>
                </Link>
                <Link
                  to={course.id}
                  className="flex gap-1 items-center w-max rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Edit
                  <span className="sr-only">Edit {course.metadata.title}</span>
                </Link>
                <Link
                  to={`new?duplicate_course_id=${course.id}`}
                  className="flex gap-1 items-center w-max rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <DocumentDuplicateIcon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Duplicate
                  <span className="sr-only">
                    Duplicate {course.metadata.title}
                  </span>
                </Link>
              </div>
            ),
          })),
        }}
        action={
          <Link
            to="new"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            + Create New Course
          </Link>
        }
        paginationOptions={{
          currentOffset: courses?.offset,
          total: courses?.count,
          limit: courses?.limit,
          setOffset: (offset) =>
            setCourseFilterOptions((q) => {
              q.offset = offset;
            }),
        }}
        searchOptions={{
          searchQuery: courseFilterOptions.search ?? "",
          setSearchQuery: (q) => {
            setCourseFilterOptions((options) => {
              options.search = q;
              options.offset = 0;
            });
          },
        }}
      />
    </>
  );
};

export default ViewCourses;
