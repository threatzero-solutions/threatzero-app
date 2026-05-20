import { SafetyContact } from "../../types/entities";
import { stripPhoneNumber, formatPhoneNumber } from "../../utils/core";

interface SafetyContactBodyProps {
  value?: Partial<SafetyContact> | null;
  /**
   * Secondary-tier rendering — slightly lighter color hierarchy so the
   * row reads as a fallback. Default = primary tier.
   */
  muted?: boolean;
}

const SafetyContactBody: React.FC<SafetyContactBodyProps> = ({
  value,
  muted,
}) => {
  if (!value) return null;
  const linkClass = `block rounded-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 hover:underline ${
    muted
      ? "text-secondary-600 hover:text-secondary-800"
      : "text-secondary-700 hover:text-secondary-900"
  }`;
  return (
    <div>
      {/* Identity block: name + title read as one unit (tight line-height,
          no internal gap). */}
      <div className="leading-tight">
        <div
          className={`font-medium ${muted ? "text-secondary-700" : "text-secondary-900"}`}
        >
          {value.name}
        </div>
        {value.title && (
          <div
            className={`text-xs ${muted ? "text-secondary-400" : "text-secondary-500"}`}
          >
            {value.title}
          </div>
        )}
      </div>

      {/* Contact-methods block: phone + email read as the second unit. The
          mt gap is wider than the within-block gap so the two blocks read
          as distinct, while still being clearly tighter than the row-to-
          row spacing the parent ul controls. */}
      {(value.phone || value.email) && (
        <div className="mt-2.5 space-y-0.5">
          {value.phone && (
            <a
              href={`tel:${stripPhoneNumber(value.phone)}`}
              className={`${linkClass} tabular-nums`}
            >
              {formatPhoneNumber(value.phone)}
            </a>
          )}
          {value.email && (
            <a
              href={`mailto:${value.email}`}
              className={`${linkClass} truncate`}
            >
              {value.email}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SafetyContactBody;
