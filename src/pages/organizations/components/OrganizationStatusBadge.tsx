import PillBadge from "../../../components/PillBadge";
import { OrganizationStatus } from "../../../types/entities";
import { humanizeSlug } from "../../../utils/core";

export const OrganizationStatusBadge = ({
  status,
}: {
  status: OrganizationStatus;
}) => {
  return (
    <PillBadge
      displayValue={humanizeSlug(status)}
      color={
        status === OrganizationStatus.ACTIVE
          ? "green"
          : status === OrganizationStatus.PENDING
          ? "yellow"
          : status === OrganizationStatus.INACTIVE
          ? "red"
          : "gray"
      }
    />
  );
};
