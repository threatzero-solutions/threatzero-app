import { PropsWithChildren } from "react";
import { classNames } from "../../../utils/core";

const ButtonGroup: React.FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <div className={classNames("flex items-center gap-2", className)}>
      {children}
    </div>
  );
};

export default ButtonGroup;
