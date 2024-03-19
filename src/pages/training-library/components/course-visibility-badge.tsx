import PillBadge from "../../../components/PillBadge";
import { TrainingVisibility } from "../../../types/entities";

const CourseVisibilityBadge: React.FC<{ visibility: TrainingVisibility }> = ({
  visibility,
}) => {
  return (
    <PillBadge
      color={visibility === TrainingVisibility.VISIBLE ? "green" : "purple"}
      value={visibility}
      displayValue={visibility.replace(/^[a-z]/, (c) => c.toUpperCase())}
    />
  );
};

export default CourseVisibilityBadge;
