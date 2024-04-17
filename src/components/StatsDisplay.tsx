import { ReactNode } from "react";

interface StatsDisplayProps {
  heading?: ReactNode;
  stats?: {
    key: string;
    name: ReactNode;
    stat: ReactNode;
    detail?: ReactNode;
  }[];
  loading?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  heading,
  loading,
}) => {
  return (
    <div>
      {heading && (
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {heading}
        </h3>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-2 sm:gap-5 sm:grid-cols-3">
        {!loading && stats ? (
          stats.map((item) => (
            <div
              key={item.key}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 overflow-hidden rounded-lg bg-white p-3 shadow sm:p-4"
            >
              <dt className="truncate text-sm font-medium text-gray-500">
                {item.name}
              </dt>
              <dd className={"text-xs font-medium text-gray-700"}>
                {item.detail}
              </dd>
              <dd className="w-full flex-none mt-1 text-xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                {item.stat}
              </dd>
            </div>
          ))
        ) : (
          <>
            <div className="animate-pulse rounded-lg bg-slate-200 px-4 py-5 shadow sm:p-6" />
            <div className="animate-pulse rounded-lg bg-slate-200 px-4 py-5 shadow sm:p-6" />
            <div className="animate-pulse rounded-lg bg-slate-200 px-4 py-5 shadow sm:p-6" />
          </>
        )}
      </dl>
    </div>
  );
};

export default StatsDisplay;
