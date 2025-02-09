import { CheckIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { TrainingVisibility } from "../../../types/entities";
import { classNames } from "../../../utils/core";

const CourseVisibilityTag: React.FC<{
  visibility: TrainingVisibility;
}> = ({ visibility }) => {
  return (
    <span
      className={classNames(
        "font-semibold text-white text-xs rounded-sm px-2 py-1 w-max inline-flex items-center h-max shrink-0",
        visibility === TrainingVisibility.HIDDEN
          ? "bg-purple-500"
          : "bg-secondary-500"
      )}
    >
      {visibility === TrainingVisibility.HIDDEN ? (
        <>
          <EyeSlashIcon className="h-4 w-4 mr-1 -ml-0.5 inline-block" />
          This course is hidden
        </>
      ) : (
        <>
          <CheckIcon className="h-4 w-4 text-green-300 mr-1 -ml-0.5 inline-block" />
          This course is published
        </>
      )}
    </span>
  );
};

export default CourseVisibilityTag;
