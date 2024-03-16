import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../utils/core';

interface NoticeProps {
  notice: string;
  className?: string;
}

const Notice: React.FC<NoticeProps> = ({ notice, className }) => {
  return (
    <div className={classNames('rounded-md bg-yellow-50 p-4', className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Notice</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{notice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notice;
