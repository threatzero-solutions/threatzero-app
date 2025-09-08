import { useMemo } from "react";
import {
  CourseEnrollment,
  TrainingSection,
} from "../../../../../../types/entities";
import {
  SectionAndNullableWindow,
  SectionAndWindow,
} from "../../../../../../types/training";
import { getSectionFeaturedWindows } from "../../../../../../utils/training";
import TrainingSectionTile from "../../../../../training-library/components/TrainingSectionTile";
import Step from "../components/Step";

export default function StepSelectTrainingSection({
  isFirstStep,
  selectedEnrollment,
  trainingSections,
  onSelectTrainingSectionAndWindow,
  onStepBackward,
}: {
  isFirstStep: boolean;
  selectedEnrollment: CourseEnrollment;
  trainingSections: TrainingSection[];
  onSelectTrainingSectionAndWindow: (
    sectionAndWindow: SectionAndWindow
  ) => void;
  onStepBackward: () => void;
}) {
  const sectionWindowMap = useMemo(
    () =>
      selectedEnrollment
        ? getSectionFeaturedWindows(selectedEnrollment, trainingSections)
        : trainingSections.map(
            (section) => ({ section, window: null } as SectionAndNullableWindow)
          ),
    [selectedEnrollment, trainingSections]
  );

  return (
    <Step
      title={
        isFirstStep
          ? "Which training section would you like to see?"
          : "Next, pick a training section."
      }
      className="w-full"
      onStepBackward={isFirstStep ? undefined : onStepBackward}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 sm:gap-6 h-[24rem] overflow-y-auto border-b border-gray-200 pb-8">
        {Array.from(sectionWindowMap.values()).map((sectionAndWindow) => (
          <TrainingSectionTile
            key={sectionAndWindow.section.id}
            section={sectionAndWindow.section}
            featuredWindow={sectionAndWindow.window}
            onNavigate={(e) => {
              e.preventDefault();
              onSelectTrainingSectionAndWindow(sectionAndWindow);
            }}
            dense
            classNames={{
              card: "border border-gray-100 drop-shadow-sm",
            }}
          />
        ))}
      </div>
    </Step>
  );
}

StepSelectTrainingSection.StepId = "select-training-section";
