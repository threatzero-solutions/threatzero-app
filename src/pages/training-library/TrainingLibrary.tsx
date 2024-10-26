import { useContext, useMemo } from "react";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { LEVEL, WRITE } from "../../constants/permissions";
import { TrainingContext } from "../../contexts/training/training-context";
import { useAuth } from "../../contexts/AuthProvider";
import { trainingLibraryPermissionsOptions } from "../../constants/permission-options";
import ViewTrainingCourse from "./components/ViewTrainingCourse";

const TrainingLibrary: React.FC = withRequirePermissions(() => {
  const { state, dispatch, courseLoading } = useContext(TrainingContext);
  const { hasPermissions } = useAuth();

  const isTrainingAdmin = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.COURSES]),
    [hasPermissions]
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
