import { ReactNode } from "react";

export interface TableHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="sm:flex sm:items-center">
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
