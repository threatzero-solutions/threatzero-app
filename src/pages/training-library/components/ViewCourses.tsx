import { useContext, useMemo } from "react";
import { TrainingContext } from "../../../contexts/training/training-context";
import { TrainingCourse } from "../../../types/entities";
import { classNames, humanizeSlug } from "../../../utils/core";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { CoreContext } from "../../../contexts/core/core-context";
import { LEVEL, WRITE } from "../../../constants/permissions";

const ViewCourses: React.FC = () => {
  const { dispatch, setActiveCourse, state } = useContext(TrainingContext);
  const { hasPermissions } = useContext(CoreContext);
  const navigate = useNavigate();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions]
  );

  const setOpen = (open: boolean) =>
    dispatch({ type: "SET_VIEW_COURSES_SLIDER_OPEN", payload: open });

  const handleActivateCourse = (course: TrainingCourse) => {
    setActiveCourse(course?.id);
    setOpen(false);
  };

  const handleNewCourse = () => {
    dispatch({ type: "SET_BUILDING_NEW_COURSE", payload: true });
    navigate("/training/library/manage/");
    setOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* HEADER */}
        <div className="bg-gray-50 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                All Courses
              </Dialog.Title>
              <p className="text-sm text-gray-500">Select a course to view</p>
            </div>
            <div className="flex h-7 items-center">
              <button
                type="button"
                className="relative text-gray-400 hover:text-gray-500"
                onClick={() => setOpen(false)}
              >
                <span className="absolute -inset-2.5" />
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* COURSES */}
        <ul className="divide-y divide-gray-100">
          {state.courses?.map((course) => (
            <li
              key={course.id}
              className="relative flex justify-between gap-x-6 px-4 py-5 sm:px-6 lg:px-8"
            >
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <div className="flex items-start flex-wrap gap-x-3">
                    <p
                      className="text-sm font-semibold leading-6 text-gray-900 line-clamp-1"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                      dangerouslySetInnerHTML={{
                        __html: course.metadata.title,
                      }}
                    />
                    {isTrainingAdmin &&
                      course.audiences.map((audience) => (
                        <p
                          key={audience.id}
                          className={classNames(
                            "hidden sm:block rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"
                          )}
                        >
                          {humanizeSlug(audience.slug)}
                        </p>
                      ))}
                  </div>
                  <p
                    className="mt-1 flex text-xs leading-5 text-gray-500 line-clamp-1"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: set by Admins only
                    dangerouslySetInnerHTML={{
                      __html: course.metadata.description,
                    }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => handleActivateCourse(course)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  View course
                  <span className="sr-only">, {course.metadata.title}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <div className="grow" />
          {isTrainingAdmin && (
            <button
              type="button"
              onClick={() => handleNewCourse()}
              className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Create New Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCourses;
