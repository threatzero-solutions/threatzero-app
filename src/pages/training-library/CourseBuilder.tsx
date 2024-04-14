import {
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TrainingContext } from "../../contexts/training/training-context";
import {
  Audience,
  Field,
  FieldType,
  InternalFieldType,
  TrainingCourse,
  TrainingMetadata,
  TrainingSection,
  TrainingVisibility,
} from "../../types/entities";
import { orderSort } from "../../utils/core";
import FormField from "../../components/forms/FormField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingCourse,
  getTrainingCourse,
  saveTrainingCourse,
} from "../../queries/training";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import TrainingSections from "./components/TrainingSections";
import AddNew from "../../components/forms/builder/AddNew";
import AudiencesSelect from "./components/AudiencesSelect";
import { LEVEL, WRITE } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import SuccessButton from "../../components/layouts/buttons/SuccessButton";
import { SimpleChangeEvent } from "../../types/core";
import { useNavigate, useSearchParams } from "react-router-dom";

type MetadataFieldType = Partial<Field> & { name: keyof TrainingMetadata };

const METADATA_INPUT_DATA: Array<MetadataFieldType> = [
  {
    name: "title",
    label: "Title",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "3rem",
    },
    required: true,
    order: 1,
  },
  {
    name: "description",
    label: "Description",
    helpText: "",
    type: InternalFieldType.HTML,
    elementProperties: {
      height: "6rem",
    },
    required: false,
    order: 2,
  },
  {
    name: "tag",
    label: "Tag",
    helpText: "Internal tag for distinguishing courses.",
    type: FieldType.TEXT,
    required: false,
    order: 3,
  },
];

const VISIBILITY_FIELD = {
  name: "visibility",
  label: "Visibility",
  helpText: "Whether to show or hide when courses are displayed.",
  type: FieldType.SELECT,
  typeParams: {
    options: Object.values(TrainingVisibility).reduce((acc, k) => {
      acc[k] = k.replace(/(^[a-z])/i, (l) => l.toUpperCase());
      return acc;
    }, {} as Record<string, string>),
  },
  required: true,
  order: 3,
};

const INITIAL_COURSE_STATE = {
  metadata: {
    title: "",
    description: "",
  },
  visibility: TrainingVisibility.HIDDEN,
  audiences: [],
  presentableBy: [],
  sections: [],
};

const CourseBuilder = () => {
  const [course, setCourse] = useState<
    Partial<TrainingCourse> & {
      metadata: TrainingMetadata;
      audiences: Audience[];
    }
  >(INITIAL_COURSE_STATE);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseSaveSuccessful, setCourseSaveSuccessful] = useState(false);

  const courseSaveTimeout = useRef<number>();
  const duplicateCourseLoaded = useRef(false);

  const { state, dispatch, setActiveCourse } = useContext(TrainingContext);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const duplicateCourseId = searchParams.get("duplicate_course_id");
  const { data: courseToDuplicate } = useQuery({
    queryKey: ["training-courses", duplicateCourseId],
    enabled: !!duplicateCourseId,
    queryFn: () => getTrainingCourse(duplicateCourseId!),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (duplicateCourseId && courseToDuplicate) {
      if (!duplicateCourseLoaded.current) {
        duplicateCourseLoaded.current = true;
        setCourse({
          metadata: {
            ...courseToDuplicate.metadata,
            tag: `${courseToDuplicate.metadata.tag} (Copy)`,
          },
          visibility: TrainingVisibility.HIDDEN,
          audiences: courseToDuplicate.audiences,
          presentableBy: courseToDuplicate.presentableBy,
          sections: courseToDuplicate.sections,
        });
      }
    } else if (!state.buildingNewCourse) {
      setCourse((c) => ({
        ...c,
        ...(state.activeCourse ?? {}),
      }));
    }
  }, [courseToDuplicate, state.activeCourse, state.buildingNewCourse]);

  const queryClient = useQueryClient();
  const saveCourseMutation = useMutation({
    mutationFn: saveTrainingCourse,
    onSuccess: (data) => {
      setCourseSaving(false);
      setActiveCourse(data.id);

      // Show course save successful check icon.
      setCourseSaveSuccessful(true);
      clearTimeout(courseSaveTimeout.current);
      courseSaveTimeout.current = setTimeout(() => {
        setCourseSaveSuccessful(false);
      }, 5000);

      queryClient.invalidateQueries({
        queryKey: ["training-courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["training-courses", data.id],
        exact: true,
      });
      setSearchParams({}, { replace: true });

      setTimeout(() => {
        dispatch({ type: "SET_BUILDING_NEW_COURSE", payload: false });
      }, 500);
    },
    onError: () => {
      setCourseSaving(false);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteTrainingCourse(state.activeCourse?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-courses"],
      });
      setActiveCourse(undefined);
      navigate("/training/library/");
    },
  });

  const isNew = useMemo(() => !course.id, [course.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no dependency
  const formValid = useMemo(
    () =>
      METADATA_INPUT_DATA.filter((i) => i.required).every(
        (i) => !!course.metadata[i.name]
      ) && course.audiences.length > 0,
    [course.metadata, course.audiences]
  );

  const handleMetadataChange = (
    input: MetadataFieldType,
    event: string | SimpleChangeEvent<unknown>
  ) => {
    const newValue = typeof event === "string" ? event : event.target?.value;

    setCourse((c) => ({
      ...c,
      metadata: {
        ...c.metadata,
        [input.name]: newValue,
      },
    }));
  };

  const handleChange = (event: SimpleChangeEvent<unknown>) => {
    setCourse((c) =>
      event.target
        ? {
            ...c,
            [event.target.name]: event.target.value,
          }
        : c
    );
  };

  const handleCourseSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCourseSaving(true);
    saveCourseMutation.mutate(course);
  };

  const handleEditSection = (section?: Partial<TrainingSection>) => {
    dispatch({
      type: "SET_ACTIVE_SECTION",
      payload: section,
    });
    dispatch({
      type: "SET_EDIT_SECTION_SLIDER_OPEN",
      payload: true,
    });
  };

  return (
    <>
      <BackButtonLink to={"/training/library/"} value={"Back to Library"} />
      <div className="space-y-12">
        <form
          onSubmit={handleCourseSave}
          className="border-b border-gray-900/10 pb-4"
        >
          <div className="grid grid-cols-1 gap-y-4 pb-8">
            {METADATA_INPUT_DATA.sort(orderSort).map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={course.metadata[field.name] ?? ""}
                onChange={(e) => handleMetadataChange(field, e)}
                mediaUploadUrl=""
              />
            ))}

            <FormField
              key={"visibility"}
              field={VISIBILITY_FIELD}
              value={course.visibility ?? TrainingVisibility.HIDDEN}
              onChange={handleChange}
              mediaUploadUrl=""
            />

            <AudiencesSelect
              name="audiences"
              label="Primary audiences"
              value={course.audiences}
              onChange={handleChange}
            />

            <AudiencesSelect
              name="presentableBy"
              label="Presentable by"
              value={course.presentableBy}
              onChange={handleChange}
            />
          </div>
          <div className="flex">
            {!isNew && (
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
                onClick={() => deleteCourseMutation.mutate()}
              >
                Delete
              </button>
            )}
            <div className="grow" />
            <SuccessButton
              isLoading={courseSaving}
              isSuccess={courseSaveSuccessful}
              disabled={!formValid}
            >
              {isNew ? "Create" : "Save"}
            </SuccessButton>
          </div>
        </form>

        {/* SECTIONS */}
        <div>
          <div className="pb-5 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Training Sections
            </h3>
            <div className="mt-3 flex sm:ml-4 sm:mt-0">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_MANAGE_ITEMS_SLIDER_OPEN",
                    payload: true,
                  })
                }
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Manage items
              </button>
              {course.sections && course.sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleEditSection()}
                  className="ml-3 inline-flex items-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                >
                  + New Section
                </button>
              )}
            </div>
          </div>
          <TrainingSections
            sections={course.sections}
            onEditSection={handleEditSection}
            fallback={
              <AddNew
                contentName="section"
                pluralContentName="sections"
                onAdd={() => handleEditSection()}
              />
            }
          />
        </div>
      </div>
    </>
  );
};

export const courseBuilderPermissionsOptions = {
  permissions: [LEVEL.ADMIN, WRITE.COURSES],
};

export default withRequirePermissions(
  CourseBuilder,
  courseBuilderPermissionsOptions
);
