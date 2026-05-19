import StatusBadge, {
  StatusBadgeTone,
} from "../../../../components/StatusBadge";
import { AssessmentStatus } from "../../../../types/entities";
import { fromStatus } from "../../../../utils/core";

interface StatusPillProps {
  status: AssessmentStatus;
}

const toneFor = (status: AssessmentStatus): StatusBadgeTone => {
  switch (status) {
    case AssessmentStatus.IN_PROGRESS:
      return "primary";
    case AssessmentStatus.CONCLUDED_MANAGEMENT_ONGOING:
      return "info";
    case AssessmentStatus.CONCLUDED_MANAGEMENT_COMPLETE:
      return "success";
    case AssessmentStatus.CLOSED_SUPERFICIAL_THREAT:
      return "muted";
    default:
      return "muted";
  }
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => (
  <StatusBadge label={fromStatus(status)} tone={toneFor(status)} />
);

export default StatusPill;
