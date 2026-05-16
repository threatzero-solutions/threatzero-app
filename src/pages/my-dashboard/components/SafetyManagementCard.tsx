import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import {
  getTipSubmissionStats,
  getTipSubmissions,
  getThreatAssessmentStats,
  getViolentIncidentReportSubmissionStats,
} from "../../../queries/safety-management";
import { TipStatus } from "../../../types/entities";
import { useMe } from "../../../contexts/me/MeProvider";

// The backend serializes `statuses` with enum *values* as keys (e.g. "new",
// not "NEW"), so we read them with a permissive shape rather than the generic
// `SafetyManagementResourceStats<Enum>` whose key typing expects enum member
// names. See SafetyConcernsDashboard.tsx for the same access pattern.
interface StatsLike {
  total: number;
  subtotals: {
    statuses: Record<string, number>;
  };
}

dayjs.extend(relativeTime);

type BreakdownTone = "amber" | "blue" | "muted";
interface BreakdownItem {
  label: string;
  value: number;
  tone: BreakdownTone;
}

interface CountBlockProps {
  title: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loading: boolean;
  total?: number;
  accent?: { count: number; label: string };
  breakdown?: BreakdownItem[];
}

const toneClass: Record<BreakdownTone, string> = {
  amber: "text-amber-700",
  blue: "text-secondary-700",
  muted: "text-gray-500",
};

const CountBlock: React.FC<CountBlockProps> = ({
  title,
  to,
  icon: Icon,
  loading,
  total,
  accent,
  breakdown,
}) => (
  <Link
    to={to}
    className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-primary-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
        <Icon aria-hidden className="h-4 w-4 text-gray-400" />
        {title}
      </div>
      <ArrowRightIcon
        aria-hidden
        className="h-4 w-4 text-gray-300 transition-colors group-hover:text-primary-500"
      />
    </div>
    {loading ? (
      <>
        <div className="h-8 w-20 animate-pulse rounded bg-gray-200/80" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
      </>
    ) : (
      <>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold leading-none tabular-nums text-gray-900">
            {total ?? 0}
          </span>
          {accent && accent.count > 0 && (
            <span className="inline-flex items-center gap-1.5 pb-0.5 text-xs font-semibold text-amber-700">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
              />
              {accent.count} {accent.label}
            </span>
          )}
        </div>
        {breakdown && breakdown.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 pt-3">
            {breakdown.map((b) => (
              <div key={b.label} className="flex flex-col leading-tight">
                <span
                  className={`text-sm font-bold tabular-nums ${toneClass[b.tone]}`}
                >
                  {b.value}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </Link>
);

const SafetyManagementCard: React.FC = () => {
  const { labels } = useMe();
  const tips = useQuery({
    queryKey: ["tip-submission-stats", {}] as const,
    queryFn: () => getTipSubmissionStats(),
  });
  const assessments = useQuery({
    queryKey: ["threat-assessment-stats", {}] as const,
    queryFn: () => getThreatAssessmentStats(),
  });
  const incidents = useQuery({
    queryKey: ["violent-incident-report-stats", {}] as const,
    queryFn: () => getViolentIncidentReportSubmissionStats(),
  });
  // The API does not default-sort list endpoints by createdOn (confirmed on
  // SafetyConcernsDashboard which always passes an explicit `order`). Mirror
  // that here so the dashboard's "Recent" really is recent.
  const recent = useQuery({
    queryKey: [
      "tip-submissions",
      { limit: 3, order: { createdOn: "DESC" } },
    ] as const,
    queryFn: ({ queryKey }) => getTipSubmissions(queryKey[1]),
  });

  const tipStats = tips.data as StatsLike | undefined;
  const assessStats = assessments.data as StatsLike | undefined;
  const vrStats = incidents.data as StatsLike | undefined;

  return (
    <section
      aria-labelledby="safety-management-heading"
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2
          id="safety-management-heading"
          className="text-base font-semibold text-gray-900"
        >
          Safety management
        </h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Your {labels.teamSingular.toLowerCase()} view
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CountBlock
          title="Safety concerns"
          to="/safety-management/safety-concerns"
          icon={InboxIcon}
          loading={tips.isPending}
          total={tipStats?.total}
          accent={
            tipStats?.subtotals.statuses.new
              ? { count: tipStats.subtotals.statuses.new, label: "new" }
              : undefined
          }
          breakdown={
            tipStats
              ? [
                  {
                    label: "New",
                    value: tipStats.subtotals.statuses.new ?? 0,
                    tone: "amber",
                  },
                  {
                    label: "Reviewed",
                    value: tipStats.subtotals.statuses.reviewed ?? 0,
                    tone: "blue",
                  },
                  {
                    label: "Resolved",
                    value: tipStats.subtotals.statuses.resolved ?? 0,
                    tone: "muted",
                  },
                ]
              : undefined
          }
        />
        <CountBlock
          title="Threat assessments"
          to="/safety-management/threat-assessments"
          icon={ClipboardDocumentCheckIcon}
          loading={assessments.isPending}
          total={assessStats?.total}
          accent={
            assessStats?.subtotals.statuses.in_progress
              ? {
                  count: assessStats.subtotals.statuses.in_progress,
                  label: "in progress",
                }
              : undefined
          }
          breakdown={
            assessStats
              ? [
                  {
                    label: "In progress",
                    value: assessStats.subtotals.statuses.in_progress ?? 0,
                    tone: "amber",
                  },
                  {
                    label: "Mgmt ongoing",
                    value:
                      assessStats.subtotals.statuses
                        .concluded_management_ongoing ?? 0,
                    tone: "blue",
                  },
                  {
                    label: "Complete",
                    value:
                      assessStats.subtotals.statuses
                        .concluded_management_complete ?? 0,
                    tone: "muted",
                  },
                ]
              : undefined
          }
        />
        <CountBlock
          title="Violent incidents"
          to="/safety-management/violent-incident-reports"
          icon={DocumentTextIcon}
          loading={incidents.isPending}
          total={vrStats?.total}
          accent={
            vrStats?.subtotals.statuses.new
              ? { count: vrStats.subtotals.statuses.new, label: "new" }
              : undefined
          }
          breakdown={
            vrStats
              ? [
                  {
                    label: "New",
                    value: vrStats.subtotals.statuses.new ?? 0,
                    tone: "amber",
                  },
                  {
                    label: "Reviewed",
                    value: vrStats.subtotals.statuses.reviewed ?? 0,
                    tone: "blue",
                  },
                ]
              : undefined
          }
        />
      </div>

      {!recent.isPending && recent.data && recent.data.results.length > 0 && (
        <div className="-mx-5 -mb-5 rounded-b-xl border-t border-gray-100 bg-gray-50/40">
          <div className="flex items-baseline justify-between px-5 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent safety concerns
            </h3>
            <Link
              to="/safety-management/safety-concerns"
              className="text-xs font-medium text-secondary-700 hover:text-secondary-800 hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          <ul className="divide-y divide-gray-100 px-2 pb-2 pt-2">
            {recent.data.results.slice(0, 3).map((tip) => (
              <li key={tip.id}>
                <Link
                  to={`/safety-management/safety-concerns/${tip.id}`}
                  className="grid grid-cols-[72px_1fr_auto_auto] items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-white"
                >
                  <span className="font-mono text-xs font-semibold text-gray-500">
                    {tip.tag ?? `#${tip.id.slice(0, 6)}`}
                  </span>
                  <span className="truncate text-sm text-gray-800">
                    {tip.unit?.name ?? "—"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {dayjs(tip.createdOn).fromNow()}
                  </span>
                  <TipStatusBadge status={tip.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

const TipStatusBadge: React.FC<{ status: TipStatus }> = ({ status }) => {
  const cls =
    status === TipStatus.NEW
      ? "bg-amber-50 text-amber-700"
      : status === TipStatus.REVIEWED
        ? "bg-secondary-50 text-secondary-700"
        : "bg-gray-100 text-gray-500";
  const label =
    status === TipStatus.NEW
      ? "New"
      : status === TipStatus.REVIEWED
        ? "Reviewed"
        : "Resolved";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default SafetyManagementCard;
