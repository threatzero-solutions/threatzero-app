import { SafetyContact } from "../../types/entities";
import { stripPhoneNumber, formatPhoneNumber } from "../../utils/core";

const SafetyContactBody: React.FC<{
  value?: Partial<SafetyContact> | null;
}> = ({ value }) => {
  return (
    <div className="grid grid-col-1">
      {value ? (
        <>
          <span className="text-lg">
            {value.name}
            {value.title ? ` - ${value.title}` : ""}
          </span>
          <a
            href={`mailto:${value.email}`}
            className="text-secondary-600 hover:text-secondary-500 transition-colors"
          >
            {value.email}
          </a>
          {value.phone && (
            <a
              href={`tel:${stripPhoneNumber(value.phone)}`}
              className="text-secondary-600 hover:text-secondary-500 transition-colors"
            >
              {formatPhoneNumber(value.phone)}
            </a>
          )}
        </>
      ) : (
        <span className="italic text-sm">No safety contact.</span>
      )}
    </div>
  );
};

export default SafetyContactBody;
