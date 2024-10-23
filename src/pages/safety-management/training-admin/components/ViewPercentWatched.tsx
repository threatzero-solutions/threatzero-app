import { classNames } from "../../../../utils/core";

const ViewPercentWatched: React.FC<{ percentWatched?: string | number }> = ({
  percentWatched,
}) => {
  const value = +(percentWatched ?? "0");
  return (
    <span
      className={classNames(
        "text-right w-full block px-5 font-semibold",
        value > 80
          ? "text-green-400"
          : value > 50
          ? "text-orange-400"
          : "text-red-400"
      )}
    >
      {value.toFixed(0)}%
    </span>
  );
};

export default ViewPercentWatched;
