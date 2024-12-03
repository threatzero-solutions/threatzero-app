import { Link, To, useLocation } from "react-router";
import { classNames } from "../../utils/core";

interface BackButtonProps {
  value?: string;
  className?: string;
  defaultTo: To;
  valueOnDefault?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  value,
  className,
  defaultTo,
  valueOnDefault,
}) => {
  const { state } = useLocation();

  return (
    <Link
      to={state?.from ?? defaultTo}
      className={classNames(
        "block text-sm text-gray-900 hover:text-gray-600 mb-4 w-max",
        className ?? ""
      )}
    >
      &larr;{" "}
      {(!state?.from && valueOnDefault ? valueOnDefault : value) ?? "Back"}
    </Link>
  );
};

export default BackButton;
