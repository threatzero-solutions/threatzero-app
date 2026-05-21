import StatusBadge, {
  StatusBadgeTone,
} from "../../../../components/StatusBadge";
import { ViolentIncidentReportStatus } from "../../../../types/entities";
import { fromStatus } from "../../../../utils/core";

interface StatusPillProps {
  status: ViolentIncidentReportStatus;
}

const toneFor = (status: ViolentIncidentReportStatus): StatusBadgeTone => {
  switch (status) {
    case ViolentIncidentReportStatus.NEW:
      return "primary";
    case ViolentIncidentReportStatus.REVIEWED:
      return "success";
    default:
      return "muted";
  }
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => (
  <StatusBadge label={fromStatus(status)} tone={toneFor(status)} />
);

export default StatusPill;
