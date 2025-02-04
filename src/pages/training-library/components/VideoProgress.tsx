// import "./VideoProgress.css"; // Import necessary styles

import { DISPLAY_COMPLETION_THRESHOLD } from "../../../constants/core";
import { classNames } from "../../../utils/core";

interface VideoProgressProps {
  className?: string;
  duration: number;
  currentTime: number;
  completionThreshold?: number;
}

const VideoProgress: React.FC<VideoProgressProps> = ({
  className,
  duration,
  currentTime,
  completionThreshold = DISPLAY_COMPLETION_THRESHOLD,
}) => {
  const circumference = 2 * Math.PI * 16;
  const progress = (currentTime / (duration || 1)) * circumference;
  const complete = progress >= circumference * completionThreshold;

  return (
    <svg viewBox="0 0 38 38" className={className}>
      <path
        className={classNames(
          complete
            ? "fill-primary-400 stroke-primary-400"
            : "fill-none stroke-gray-200",
          "stroke-4 transition-all"
        )}
        style={{
          strokeLinecap: "round",
        }}
        d="M19 3
              a 16 16 0 0 1 0 32
              a 16 16 0 0 1 0 -32"
      />
      <path
        className="fill-none stroke-primary-400 stroke-4 transition-all"
        style={{
          strokeLinecap: "round",
        }}
        strokeDasharray={`${
          complete ? circumference : progress
        }, ${circumference}`}
        d="M19 3
              a 16 16 0 0 1 0 32
              a 16 16 0 0 1 0 -32"
      />
      <path
        transform="translate(11.5, 11.5),scale(0.75)"
        className={classNames(
          "fill-white stroke-white stroke-1 transition-opacity",
          complete ? "opacity-100" : "opacity-0"
        )}
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      />
      <text
        x="50%"
        y="50%"
        className={classNames(
          "text-[0.6rem] transition-opacity",
          complete ? "opacity-0" : "opacity-100"
        )}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {Math.floor(progress)}%
      </text>
    </svg>
  );
};

export default VideoProgress;
