import { PlusIcon } from "@heroicons/react/20/solid";

interface AddNewProps {
  contentName: string;
  pluralContentName: string;
  qualifier?: string | null;
  onAdd: () => void;
  disabled?: boolean;
}

const AddNew: React.FC<AddNewProps> = ({
  contentName,
  pluralContentName,
  qualifier: _qualifier,
  onAdd,
  disabled = false,
}) => {
  const qualifier = _qualifier === null ? "" : (_qualifier ?? "new") + " ";
  return (
    <div className="text-center col-span-full">
      <h3 className="text-sm font-semibold text-gray-900">
        No {pluralContentName.toLowerCase()}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by adding {qualifier}
        {pluralContentName.toLowerCase()}.
      </p>
      <div className="mt-6">
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50 disabled:pointer-events-none"
          onClick={onAdd}
          disabled={disabled}
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          {(qualifier + contentName)
            .split(" ")
            .map((x) => x[0].toUpperCase() + x.slice(1))
            .join(" ")}
        </button>
      </div>
    </div>
  );
};

export default AddNew;
