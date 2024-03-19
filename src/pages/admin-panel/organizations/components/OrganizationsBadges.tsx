import PillBadge from "../../../../components/PillBadge";
import { Organization } from "../../../../types/entities";

const OrganizationsBadges: React.FC<{
  organizations: Organization[];
  max: number;
}> = ({ organizations, max }) => {
  return (
    <div className="flex flex-wrap">
      {organizations.length === 0 && (
        <PillBadge
          color={"gray"}
          value={""}
          displayValue={"No organizations"}
        />
      )}
      {organizations.slice(0, max + 1).map((o) => (
        <PillBadge key={o.id} color={"blue"} value={""} displayValue={o.name} />
      ))}
      {organizations.length > max && (
        <PillBadge
          color={"blue"}
          value={""}
          displayValue={`+${organizations.length - max} more`}
        />
      )}
    </div>
  );
};

export default OrganizationsBadges;
