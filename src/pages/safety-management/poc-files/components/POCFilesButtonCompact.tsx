import { UserPlusIcon } from "@heroicons/react/20/solid";
import { POCFile } from "../../../../types/entities";
import { classNames } from "../../../../utils/core";

const POCFilesButtonCompact: React.FC<{
  pocFiles: POCFile[];
  className?: string;
}> = ({ pocFiles, className }) => {
  return (
    <button
      type="button"
      className={classNames(
        "inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors",
        pocFiles.length
          ? "bg-secondary-600 hover:bg-secondary-700 focus-visible:outline-secondary-700"
          : "bg-gray-400 hover:bg-gray-500 focus-visible:outline-gray-500",
        className
      )}
      title="Manage Person of Concern (PoC) Files"
    >
      {pocFiles.length}
      <UserPlusIcon className="w-5 h-5 group-hover:opacity-80 transition-opacity" />
    </button>
  );
};

export default POCFilesButtonCompact;
