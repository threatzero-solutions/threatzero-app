import { useContext, useMemo, Fragment } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { LEVEL, WRITE } from "../../constants/permissions";
import { TrainingContext } from "../../contexts/training/training-context";
import { trainingSectionSort } from "../../utils/training";
import TrainingSections from "./components/TrainingSections";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { classNames } from "../../utils/core";
import { EyeSlashIcon, FolderOpenIcon } from "@heroicons/react/20/solid";
import PillBadge from "../../components/PillBadge";
import { TrainingVisibility } from "../../types/entities";
import FeaturedSection from "./components/FeaturedSection";
import { useAuth } from "../../contexts/AuthProvider";
import { trainingLibraryPermissionsOptions } from "../../constants/permission-options";

interface NewCourseOptions {
  duplicateCourseId?: string;
}

const TrainingLibrary: React.FC = withRequirePermissions(() => {
  const { state, dispatch, setActiveCourse } = useContext(TrainingContext);
  const { hasPermissions } = useAuth();
  const navigate = useNavigate();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions]
  );

  const sections = useMemo(() => {
    if (!state.activeCourse?.sections) {
      return;
    }

    return state.activeCourse.sections.sort(trainingSectionSort);
  }, [state.activeCourse?.sections]);

  const handleNewCourse = (options: NewCourseOptions = {}) => {
    dispatch({ type: "SET_BUILDING_NEW_COURSE", payload: true });
    setActiveCourse(undefined);
    navigate(
      `/training/library/manage/${
        options.duplicateCourseId
          ? `?duplicate_course_id=${options.duplicateCourseId}`
          : ""
      }`
    );
  };

  return (
    <div className="flex flex-col px-5 h-full">
      {(isTrainingAdmin || (state.courses && state.courses.length > 0)) &&
        state.activeCourse && (
          <div className="pb-5 flex items-center justify-between">
            <div className="grid">
              {isTrainingAdmin &&
                state.activeCourse.visibility === TrainingVisibility.HIDDEN && (
                  <span className="w-max mb-2 rounded bg-purple-600 px-4 py-1 text-sm font-semibold text-white shadow-sm inline-flex items-center gap-2">
                    <EyeSlashIcon className="h-4 w-4" />
                    This course is hidden
                  </span>
                )}
              <div className="flex items-center gap-4 flex-wrap">
                <h1
                  className="text-2xl font-bold text-gray-900"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: dangerouslySetInnerHTML is safe
                  dangerouslySetInnerHTML={{
                    __html: state.activeCourse.metadata.title,
                  }}
                />
                {isTrainingAdmin && (
                  <>
                    {state.activeCourse.metadata.tag && (
                      <PillBadge
                        color={"secondary"}
                        value={state.activeCourse.metadata.tag}
                        displayValue={state.activeCourse.metadata.tag}
                      />
                    )}
                  </>
                )}
              </div>
              <p
                className="text-sm font-medium text-gray-500"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: dangerouslySetInnerHTML is safe
                dangerouslySetInnerHTML={{
                  __html: state.activeCourse.metadata.description ?? "",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_VIEW_COURSES_SLIDER_OPEN",
                    payload: true,
                  })
                }
                className="w-max mt-2 rounded bg-secondary-50 px-2 py-1 text-sm font-semibold text-secondary-600 shadow-sm hover:bg-secondary-100"
              >
                See other courses &rarr;
              </button>
            </div>
            <div className="mt-3 flex sm:ml-4 sm:mt-0">
              {isTrainingAdmin && (
                <Menu as="div" className="relative flex-none">
                  <MenuButton className="-m-1 block p-1 text-gray-500 hover:text-gray-900 my-auto">
                    <span className="sr-only">Open options</span>
                    <EllipsisVerticalIcon
                      className="h-7 w-7"
                      aria-hidden="true"
                    />
                  </MenuButton>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                      <MenuItem>
                        {({ focus }) => (
                          <Link
                            to={`/training/library/manage?courseId=${state.activeCourse?.id}`}
                            className={classNames(
                              focus ? "bg-gray-50" : "",
                              "block px-3 py-1 text-sm leading-6 text-gray-900 text-end"
                            )}
                          >
                            Manage
                            <span className="sr-only">
                              , {state.activeCourse?.metadata.title}
                            </span>
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            type="button"
                            onClick={() =>
                              handleNewCourse({
                                duplicateCourseId: state.activeCourse?.id,
                              })
                            }
                            className={classNames(
                              focus ? "bg-gray-50" : "",
                              "px-3 py-1 text-sm leading-6 text-gray-900 w-max text-end"
                            )}
                          >
                            Duplicate Course
                            <span className="sr-only">
                              , {state.activeCourse?.metadata.title}
                            </span>
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Transition>
                </Menu>
              )}
            </div>
          </div>
        )}
      {state.activeCourse === null ? (
        <div className="text-center h-full flex flex-col items-center justify-center">
          <FolderOpenIcon
            className="h-12 w-12 text-gray-400"
            aria-hidden="true"
          />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No courses available
          </h3>
          <p className="mt-1 text-sm text-gray-500">Try checking back later.</p>
          {isTrainingAdmin && (
            <button
              type="button"
              onClick={() => handleNewCourse()}
              className="mt-4 inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Create New Course
            </button>
          )}
        </div>
      ) : (
        <>
          <FeaturedSection
            sections={sections}
            loading={state.activeCourse === undefined}
          />
          <h2 className="mt-12 text-xl text-gray-700">All Content</h2>
          <TrainingSections sections={sections} />
        </>
      )}
    </div>
  );
}, trainingLibraryPermissionsOptions);

export default TrainingLibrary;
