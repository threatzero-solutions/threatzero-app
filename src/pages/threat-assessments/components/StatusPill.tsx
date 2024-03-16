import PillBadge from '../../../components/PillBadge';
import { AssessmentStatus } from '../../../types/entities';
import { fromStatus } from '../../../utils/core';

interface StatusPillProps {
  status: AssessmentStatus;
}

const getColorFromStatus = (status: AssessmentStatus) => {
  switch (status) {
    case AssessmentStatus.IN_PROGRESS:
      return 'yellow';
    case AssessmentStatus.CONCLUDED_MANAGEMENT_ONGOING:
      return 'blue';
    case AssessmentStatus.CONCLUDED_MANAGEMENT_COMPLETE:
      return 'green';
    default:
      return 'gray';
  }
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  return (
    <PillBadge
      color={getColorFromStatus(status)}
      value={status}
      displayValue={fromStatus(status)}
    />
  );
};

export default StatusPill;
