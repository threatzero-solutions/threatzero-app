import { ReactNode } from "react";
import { classNames } from "../../../utils/core";

export interface TableHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={classNames("sm:flex sm:items-center", className)}>
      <div className="sm:flex-auto">
        {title && (
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-2 text-sm text-gray-700">{subtitle}</p>}
      </div>
      {action && (
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">{action}</div>
      )}
    </div>
  );
};

export default TableHeader;
