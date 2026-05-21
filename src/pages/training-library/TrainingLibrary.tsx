import { useContext, useMemo } from "react";
import { CAP } from "../../constants/capabilities";
import { trainingLibraryPermissionsOptions } from "../../constants/permission-options";
import { useMe } from "../../contexts/me/MeProvider";
import { TrainingContext } from "../../contexts/training/training-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import ViewTrainingCourse from "./components/ViewTrainingCourse";

const TrainingLibrary: React.FC = withRequirePermissions(() => {
  const { state, dispatch, setActiveEnrollmentId, courseLoading } =
    useContext(TrainingContext);
  const { can } = useMe();

  const isTrainingAdmin = useMemo(
    () => can(CAP.MANAGE_TRAINING_CONTENT),
    [can],
  );

  // `courseLoading` reflects the course query, which is disabled (and so
  // reports `pending`) until an enrollment is selected. Resolve a real
  // loading flag: still loading while enrollments are unresolved, or while
  // a selected enrollment's course is in flight — but not when the user
  // genuinely has zero enrollments.
  const loading = useMemo(() => {
    if (state.enrollments === undefined) return true;
    if (state.enrollments.length === 0) return false;
    return !state.activeEnrollment || courseLoading;
  }, [state.enrollments, state.activeEnrollment, courseLoading]);

  const selectEnrollment = (enrollmentId: string) => {
    const enrollment = state.enrollments?.find((e) => e.id === enrollmentId);
    if (!enrollment) return;
    dispatch({ type: "SET_ACTIVE_ENROLLMENT", payload: enrollment });
    setActiveEnrollmentId(enrollmentId);
  };

  return (
    <ViewTrainingCourse
      course={state.activeCourse}
      enrollment={state.activeEnrollment}
      loading={loading}
      isTrainingAdmin={isTrainingAdmin}
      enrollments={state.enrollments}
      onSelectEnrollment={selectEnrollment}
      onSeeOtherCourses={() =>
        dispatch({
          type: "SET_VIEW_COURSES_SLIDER_OPEN",
          payload: true,
        })
      }
    />
  );
}, trainingLibraryPermissionsOptions);

export default TrainingLibrary;
