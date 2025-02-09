import { Link, To } from "react-router";
import { classNames } from "../../utils/core";

interface BackButtonLinkProps {
  to: To;
  value?: string;
  className?: string;
}

const BackButtonLink: React.FC<BackButtonLinkProps> = ({
  to,
  value,
  className,
}) => {
  return (
    <Link
      to={to}
      className={classNames(
        "block text-sm text-gray-900 hover:text-gray-600 mb-4 w-max",
        className ?? ""
      )}
    >
      &larr; {value ?? "Back"}
    </Link>
  );
};

export default BackButtonLink;
