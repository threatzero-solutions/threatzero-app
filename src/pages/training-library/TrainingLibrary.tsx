import { useContext, useMemo } from "react";
import { CAP } from "../../constants/capabilities";
import { trainingLibraryPermissionsOptions } from "../../constants/permission-options";
import { useMe } from "../../contexts/me/MeProvider";
import { TrainingContext } from "../../contexts/training/training-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import ViewTrainingCourse from "./components/ViewTrainingCourse";

const TrainingLibrary: React.FC = withRequirePermissions(() => {
  const { state, dispatch, courseLoading } = useContext(TrainingContext);
  const { can } = useMe();

  const isTrainingAdmin = useMemo(
    () => can(CAP.MANAGE_TRAINING_CONTENT),
    [can],
  );

  return (
    <ViewTrainingCourse
      course={state.activeCourse}
      enrollment={state.activeEnrollment}
      loading={courseLoading}
      showMultipleEnrollments={
        !!state.enrollments && state.enrollments.length > 0
      }
      isTrainingAdmin={isTrainingAdmin}
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
