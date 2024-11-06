import { useContext, useMemo, useState } from "react";
import { TrainingContext } from "../../../contexts/training/training-context";
import {
  Audience,
  Field,
  FieldType,
  InternalFieldType,
  TrainingCourse,
  TrainingMetadata,
  TrainingSection,
  TrainingVisibility,
} from "../../../types/entities";
import { stripHtml } from "../../../utils/core";
import FormField from "../../../components/forms/FormField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTrainingCourse,
  getTrainingCourse,
  saveTrainingCourse,
} from "../../../queries/training";
import BackButtonLink from "../../../components/layouts/BackButtonLink";
import TrainingSections from "../../training-library/components/TrainingSections";
import AddNew from "../../../components/forms/builder/AddNew";
import AudiencesSelect from "../../training-library/components/AudiencesSelect";
import { withRequirePermissions } from "../../../guards/with-require-permissions";
import SuccessButton from "../../../components/layouts/buttons/SuccessButton";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CoreContext } from "../../../contexts/core/core-context";
import { courseBuilderPermissionsOptions } from "../../../constants/permission-options";
import CourseVisibilityTag from "../../training-library/components/CourseVisibilityTag";
import { Controller, FieldPath, useForm } from "react-hook-form";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import EditTrainingSection from "../../training-library/components/EditTrainingSection";
import LargeFormSection from "../../../components/forms/LargeFormSection";
import { useDebounceCallback } from "usehooks-ts";

type CourseFieldType = Partial<Field> & { name: FieldPath<TrainingCourse> };

const METADATA_INPUT_DATA: Array<CourseFieldType> = [
  {
    name: "metadata.title",
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
    name: "metadata.description",
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
    name: "metadata.tag",
    label: "Tag",
    helpText: "Internal tag for distinguishing courses.",
    type: FieldType.TEXT,
    required: false,
    order: 3,
  },
];

type PartialCourse = Partial<TrainingCourse> & {
  metadata: TrainingMetadata;
  audiences: Audience[];
};

const INITIAL_COURSE_STATE: PartialCourse = {
  metadata: {
    title: "",
    description: "",
    tag: "",
  },
  visibility: TrainingVisibility.HIDDEN,
  audiences: [],
  presentableBy: [],
  sections: [],
};

const CourseBuilder = withRequirePermissions(() => {
  const [courseSaveSuccessful, setCourseSaveSuccessful] = useState(false);
  const [sectionEditSliderOpen, setSectionEditSliderOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<
    string | undefined
  >();

  const { dispatch, courseLoading } = useContext(TrainingContext);
  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const isNew = useMemo(() => params.id === "new", [params.id]);

  const { data: course } = useQuery({
    queryKey: ["training-course", "id", params.id] as const,
    queryFn: ({ queryKey }) => getTrainingCourse(queryKey[2]),
    enabled: !!params.id && !isNew,
    refetchOnWindowFocus: false,
  });

  const duplicateCourseId = searchParams.get("duplicate_course_id");
  const { data: courseToDuplicate } = useQuery({
    queryKey: ["training-course", "id", duplicateCourseId],
    enabled: !!duplicateCourseId && isNew,
    queryFn: () => getTrainingCourse(duplicateCourseId!),
    refetchOnWindowFocus: false,
  });

  const courseData = useMemo(() => {
    let thisCourseData: PartialCourse = INITIAL_COURSE_STATE;

    if (courseToDuplicate) {
      thisCourseData = {
        metadata: {
          ...courseToDuplicate.metadata,
          tag: `${courseToDuplicate.metadata.tag} (Copy)`,
        },
        visibility: TrainingVisibility.HIDDEN,
        audiences: courseToDuplicate.audiences,
        presentableBy: courseToDuplicate.presentableBy,
        sections: courseToDuplicate.sections.map((s) => {
          Reflect.deleteProperty(s, "id");
          s.items?.map((i) => {
            Reflect.deleteProperty(i, "id");
            return i;
          });
          return s;
        }),
      };
    } else if (course) {
      thisCourseData = course;
    }

    return thisCourseData;
  }, [courseToDuplicate, course]);

  const { register, handleSubmit, watch, control } = useForm({
    values: courseData,
  });

  const courseId = watch("id");
  const title = watch("metadata.title");
  const visibility = watch("visibility");

  const debouncedSetCourseSaveSuccessful = useDebounceCallback(
    setCourseSaveSuccessful,
    5000
  );

  const queryClient = useQueryClient();
  const saveCourseMutation = useMutation({
    mutationFn: saveTrainingCourse,
    onSuccess: (data) => {
      // Show course save successful check icon.
      setCourseSaveSuccessful(true);
      debouncedSetCourseSaveSuccessful(false);

      queryClient.invalidateQueries({
        queryKey: ["training-courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["training-course", "id", data.id],
      });
      navigate(`../${data.id}`);
      setSearchParams({}, { replace: true });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: TrainingCourse["id"] | undefined) =>
      deleteTrainingCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-courses"],
      });
      navigate("../");
      setConfirmationClose();
    },
  });

  const handleCourseSave = (data: PartialCourse) => {
    saveCourseMutation.mutate(data);
  };

  const handleEditSection = (section?: Partial<TrainingSection>) => {
    setEditingSectionId(section?.id);
    setSectionEditSliderOpen(true);
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${stripHtml(title || "")}`,
      message: `Are you sure you want to delete this course?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteCourseMutation.mutate(courseId);
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

  return (
    <>
      <BackButtonLink to={"../"} value={"Back to Courses"} />
      <div className="space-y-12">
        <form
          onSubmit={handleSubmit(handleCourseSave)}
          className="border-b border-gray-900/10 pb-4"
        >
          <div className="grid grid-cols-1 gap-y-4 pb-8">
            <div className="flex items-center gap-2">
              <CourseVisibilityTag
                visibility={visibility ?? TrainingVisibility.HIDDEN}
              />
              {!isNew && (
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-500 text-xs underline cursor-pointer"
                  onClick={() => {
                    saveCourseMutation.mutate({
                      id: courseId,
                      visibility:
                        visibility === TrainingVisibility.HIDDEN
                          ? TrainingVisibility.VISIBLE
                          : TrainingVisibility.HIDDEN,
                    });
                  }}
                >
                  {visibility === TrainingVisibility.HIDDEN
                    ? "Publish"
                    : "Unpublish (hide)"}
                </button>
              )}
            </div>

            <LargeFormSection heading="Overview" defaultOpen>
              <div className="space-y-4">
                {METADATA_INPUT_DATA.map((field) => (
                  <FormField
                    key={field.name}
                    {...register(field.name)}
                    field={field}
                    control={control}
                  />
                ))}
              </div>
            </LargeFormSection>

            <LargeFormSection heading="Visibility">
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="audiences"
                  rules={{
                    validate: (value) => !!value && value.length > 0,
                  }}
                  render={({ field }) => (
                    <AudiencesSelect
                      label="Primary audiences"
                      value={field.value}
                      required={true}
                      onChange={(a) => field.onChange(a.target?.value ?? [])}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="presentableBy"
                  render={({ field }) => (
                    <AudiencesSelect
                      label="Presentable by"
                      value={field.value}
                      onChange={(a) => field.onChange(a.target?.value ?? [])}
                    />
                  )}
                />
              </div>
            </LargeFormSection>
          </div>
          <div className="flex">
            {!isNew && (
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <div className="grow" />
            <SuccessButton
              isLoading={saveCourseMutation.isPending}
              isSuccess={courseSaveSuccessful}
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
                onClick={() => {
                  dispatch({
                    type: "SET_MANAGE_ITEMS_SLIDER_OPEN",
                    payload: true,
                  });
                }}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Manage items
              </button>
              {courseData?.sections && courseData?.sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleEditSection()}
                  disabled={isNew}
                  className="ml-3 inline-flex items-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50"
                >
                  + New Section
                </button>
              )}
            </div>
          </div>
          <TrainingSections
            sections={courseData?.sections}
            onEditSection={handleEditSection}
            loading={courseLoading}
            fallback={
              !isNew ? (
                <AddNew
                  contentName="section"
                  pluralContentName="sections"
                  onAdd={() => handleEditSection()}
                />
              ) : (
                <span className="text-sm italic text-gray-600 col-span-full text-center">
                  Finish creating course to start adding sections.
                </span>
              )
            }
          />
        </div>
      </div>
      <SlideOver
        open={sectionEditSliderOpen}
        setOpen={setSectionEditSliderOpen}
      >
        <EditTrainingSection
          setOpen={setSectionEditSliderOpen}
          courseId={courseId}
          sectionId={editingSectionId}
          sectionCount={courseData?.sections?.length}
        />
      </SlideOver>
    </>
  );
}, courseBuilderPermissionsOptions);

export default CourseBuilder;
