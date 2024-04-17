import { useContext } from "react";
import { TrainingContext } from "../../contexts/training/training-context";
import FeaturedSection from "../training-library/components/FeaturedSection";

const MyDashboard: React.FC = () => {
  const { state } = useContext(TrainingContext);

  return (
    <div className={"space-y-12"}>
      <h3 className="text-2xl font-semibold leading-6 text-gray-900">
        My Dashboard
      </h3>
      <FeaturedSection
        loading={state.activeCourse === undefined}
        sections={state.activeCourse?.sections}
        title="Featured Training"
        showAllTrainingLink
      />
    </div>
  );
};

export default MyDashboard;
