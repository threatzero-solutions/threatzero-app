import PillBadge from "../../../../components/PillBadge";
import { ViolentIncidentReportStatus } from "../../../../types/entities";
import { fromStatus } from "../../../../utils/core";

interface StatusPillProps {
  status: ViolentIncidentReportStatus;
}

const getColorFromStatus = (status: ViolentIncidentReportStatus) => {
  switch (status) {
    case ViolentIncidentReportStatus.NEW:
      return "yellow";
    case ViolentIncidentReportStatus.REVIEWED:
      return "green";
    default:
      return "gray";
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
