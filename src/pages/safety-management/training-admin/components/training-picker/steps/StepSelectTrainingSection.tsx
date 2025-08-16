import { useEffect, useMemo } from "react";
import {
  CourseEnrollment,
  TrainingSection,
} from "../../../../../../types/entities";
import { SectionAndWindow } from "../../../../../../types/training";
import { getSectionFeaturedWindows } from "../../../../../../utils/training";
import TrainingSectionTile from "../../../../../training-library/components/TrainingSectionTile";
import Step from "../components/Step";

export default function StepSelectTrainingSection({
  isFirstStep,
  selectedEnrollment,
  trainingSections,
  onSelectTrainingSectionAndWindow,
}: {
  isFirstStep: boolean;
  selectedEnrollment: CourseEnrollment;
  trainingSections: TrainingSection[];
  onSelectTrainingSectionAndWindow: (
    sectionAndWindow: SectionAndWindow
  ) => void;
}) {
  const sectionWindowMap = useMemo(
    () =>
      selectedEnrollment
        ? getSectionFeaturedWindows(selectedEnrollment, trainingSections)
        : new Map(
            trainingSections.map((section) => [
              section.id,
              { section, window: null } as SectionAndWindow,
            ])
          ),
    [selectedEnrollment, trainingSections]
  );

  useEffect(() => {
    if (sectionWindowMap.size === 1) {
      const sectionAndWindow = sectionWindowMap.values().next().value;
      if (sectionAndWindow) {
        onSelectTrainingSectionAndWindow(sectionAndWindow);
      }
    }
  }, [onSelectTrainingSectionAndWindow, sectionWindowMap]);

  return (
    <Step
      title={
        isFirstStep
          ? "First, which training section would you like to see?"
          : "Next, pick a training section."
      }
      className="w-full"
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
