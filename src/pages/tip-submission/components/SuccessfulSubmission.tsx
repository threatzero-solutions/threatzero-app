import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const SuccessfulSubmission: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center h-72">
      <CheckBadgeIcon className="h-12 w-12 text-green-500" />
      <p className="text-3xl text-green-500">Success!</p>
      <p className="text-xl">Thank you.</p>
    </div>
  );
};

export default SuccessfulSubmission;
