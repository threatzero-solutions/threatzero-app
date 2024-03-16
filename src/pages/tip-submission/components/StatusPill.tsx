import PillBadge from '../../../components/PillBadge';
import { TipStatus } from '../../../types/entities';
import { fromStatus } from '../../../utils/core';

interface StatusPillProps {
  status: TipStatus;
}

const getColorFromStatus = (status: TipStatus) => {
  switch (status) {
    case TipStatus.NEW:
      return 'yellow';
    case TipStatus.REVIEWED:
      return 'blue';
    case TipStatus.RESOLVED:
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
