import { PropsWithChildren } from "react";
import { classNames } from "../../../utils/core";

const Block: React.FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <div
      className={classNames(
        "shadow-sm rounded-md ring-1 ring-inset ring-gray-200 py-4 px-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Block;
