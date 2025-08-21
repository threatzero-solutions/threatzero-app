import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { Updater, useImmer } from "use-immer";
import { create } from "zustand";
import { getCourseEnrollments } from "../../../../../queries/organizations";
import { getTrainingCourse } from "../../../../../queries/training";
import { CourseEnrollment } from "../../../../../types/entities";
import { SectionAndWindow } from "../../../../../types/training";
import StepSelectCourseEnrollment from "./steps/StepSelectCourseEnrollment";
import StepSelectTrainingSection from "./steps/StepSelectTrainingSection";

interface StepsState {
  stepId: string;
  stepTo: (stepId: string, direction?: "forward" | "backward") => void;
  stepDirection: "forward" | "backward" | "none";
  reset: () => void;
}

interface PickerState {
  organizationId: string;
  currentSectionAndWindow?: SectionAndWindow;
  currentCourseEnrollment?: CourseEnrollment;
}

const initialStepsState = {
  stepDirection: "none",
} as const;

const createUseSteps = (options: { firstStepId: string }) => {
  const initialState = {
    ...initialStepsState,
    stepId: options.firstStepId,
  };

  return create<StepsState>((set) => ({
    ...initialState,
    stepTo: (stepId: string, direction: "forward" | "backward" = "forward") =>
      set({ stepId, stepDirection: direction }),
    reset: () => set(initialState),
  }));
};

const useSteps = createUseSteps({
  firstStepId: StepSelectCourseEnrollment.StepId,
});

export default function TrainingPicker({
  organizationId,
  onChangeTrainingData,
}: {
  organizationId: string;
  onChangeTrainingData: (data: {
    courseEnrollment: CourseEnrollment;
    sectionAndWindow: SectionAndWindow;
  }) => void;
}) {
  const { stepId, stepTo, stepDirection, reset: resetSteps } = useSteps();

  useEffect(() => {
    return () => {
      resetSteps();
    };
  }, [resetSteps]);

  const [pickerState, setPickerState] = useImmer<PickerState>({
    organizationId,
    currentSectionAndWindow: undefined,
    currentCourseEnrollment: undefined,
  });

  useEffect(() => {
    setPickerState((draft) => {
      draft.organizationId = organizationId;
    });
  }, [organizationId, setPickerState]);

  return (
    <div className="h-full w-full flex flex-col items-center">
      <CurrentStep
        stepId={stepId}
        stepTo={stepTo}
        stepDirection={stepDirection}
        pickerState={pickerState}
        setPickerState={setPickerState}
        onChangeTrainingData={onChangeTrainingData}
      />
    </div>
  );
}

const CurrentStep = ({
  stepId,
  stepTo,
  stepDirection,
  pickerState,
  setPickerState,
  onChangeTrainingData,
}: {
  stepId: StepsState["stepId"];
  stepTo: StepsState["stepTo"];
  stepDirection: StepsState["stepDirection"];
  pickerState: PickerState;
  setPickerState: Updater<PickerState>;
  onChangeTrainingData: (data: {
    courseEnrollment: CourseEnrollment;
    sectionAndWindow: SectionAndWindow;
  }) => void;
}) => {
  const { data: courseEnrollments } = useQuery({
    queryKey: ["course-enrollments", pickerState.organizationId] as const,
    queryFn: ({ queryKey }) =>
      getCourseEnrollments(queryKey[1]).then((r) => r.results),
  });

  const { data: currentTrainingCourse } = useQuery({
    queryKey: [
      "training-courses",
      pickerState.currentCourseEnrollment?.course.id,
    ] as const,
    queryFn: ({ queryKey }) => getTrainingCourse(queryKey[1]!),
    enabled: !!pickerState.currentCourseEnrollment?.course.id,
  });

  const trainingSections = useMemo(() => {
    if (!currentTrainingCourse) return;
    return currentTrainingCourse.sections;
  }, [currentTrainingCourse]);

  const step = useMemo(() => {
    switch (stepId) {
      case StepSelectCourseEnrollment.StepId:
        return courseEnrollments ? (
          <StepSelectCourseEnrollment
            courseEnrollments={courseEnrollments}
            onSelectCourseEnrollment={(courseEnrollment) => {
              setPickerState((draft) => {
                draft.currentCourseEnrollment = courseEnrollment;
              });
              stepTo(StepSelectTrainingSection.StepId, "forward");
            }}
          />
        ) : (
          <LoadingStep />
        );
      case StepSelectTrainingSection.StepId:
        return pickerState.currentCourseEnrollment && trainingSections ? (
          <StepSelectTrainingSection
            isFirstStep={courseEnrollments?.length === 1}
            selectedEnrollment={pickerState.currentCourseEnrollment}
            trainingSections={trainingSections}
            onSelectTrainingSectionAndWindow={(sectionAndWindow) => {
              setPickerState((draft) => {
                draft.currentSectionAndWindow = sectionAndWindow;
              });

              if (pickerState.currentCourseEnrollment) {
                onChangeTrainingData({
                  courseEnrollment: pickerState.currentCourseEnrollment,
                  sectionAndWindow,
                });
              }
            }}
            onStepBackward={() => {
              stepTo(StepSelectCourseEnrollment.StepId, "backward");
            }}
          />
        ) : (
          <LoadingStep />
        );
      default:
        null;
    }
  }, [
    stepId,
    courseEnrollments,
    trainingSections,
    setPickerState,
    stepTo,
    pickerState.currentCourseEnrollment,
    onChangeTrainingData,
  ]);

  return (
    <div className="h-full w-full relative">
      <AnimatePresence custom={stepDirection}>
        <motion.div
          key={stepId}
          className="absolute inset-0 flex flex-col items-center justify-center"
          custom={stepDirection}
          variants={{
            slideIn: (direction: typeof stepDirection) => ({
              opacity: 0,
              translateX:
                direction === "forward"
                  ? "100%"
                  : direction === "backward"
                  ? "-100%"
                  : "0%",
            }),
            slideOut: (direction: typeof stepDirection) => ({
              opacity: 0,
              translateX: direction === "backward" ? "100%" : "-100%",
            }),
          }}
          initial="slideIn"
          animate={{
            opacity: 1,
            translateX: "0%",
          }}
          exit="slideOut"
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 26,
          }}
        >
          {step}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const LoadingStep = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
    </div>
  );
};
