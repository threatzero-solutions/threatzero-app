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
        "flex items-center gap-1 cursor-pointer group",
        className
      )}
      title="Manage Person of Concern (PoC) Files"
    >
      <span
        className={classNames(
          "inline-flex items-center justify-center text-white rounded-full w-6 h-6 font-medium",
          pocFiles.length ? "bg-secondary-600" : "bg-gray-400"
        )}
      >
        {pocFiles.length}
      </span>
      <UserPlusIcon className="w-5 h-5 group-hover:opacity-80 transition-opacity" />
    </button>
  );
};

export default POCFilesButtonCompact;
