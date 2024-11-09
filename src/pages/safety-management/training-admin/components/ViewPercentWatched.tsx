import { classNames } from "../../../../utils/core";

const ViewPercentWatched: React.FC<{ percentWatched?: string | number }> = ({
  percentWatched,
}) => {
  const value = +(percentWatched ?? "0");
  return (
    <span
      className={classNames(
        "font-bold block text-xs rounded-md text-white py-1 w-12 text-center",
        value > 85
          ? "bg-green-500"
          : value > 50
          ? "bg-yellow-500"
          : "bg-red-500"
      )}
    >
      {value.toFixed(0)}%
    </span>
  );
};

export default ViewPercentWatched;
