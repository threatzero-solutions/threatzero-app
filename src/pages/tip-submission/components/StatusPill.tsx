import StatusBadge, { StatusBadgeTone } from "../../../components/StatusBadge";
import { TipStatus } from "../../../types/entities";
import { fromStatus } from "../../../utils/core";

interface StatusPillProps {
  status: TipStatus;
}

const toneFor = (status: TipStatus): StatusBadgeTone => {
  switch (status) {
    case TipStatus.NEW:
      return "primary";
    case TipStatus.REVIEWED:
      return "secondary";
    case TipStatus.RESOLVED:
      return "success";
    default:
      return "muted";
  }
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => (
  <StatusBadge label={fromStatus(status)} tone={toneFor(status)} />
);

export default StatusPill;
