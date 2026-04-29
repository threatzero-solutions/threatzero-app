import { Link } from "react-router";
import { useAuth } from "../../contexts/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationBySlug,
  getUnitBySlug,
} from "../../queries/organizations";
import SafetyContactBody from "../../components/safety-management/SafetyContactBody";
import { useMe } from "../../contexts/me/MeProvider";
import { CAP } from "../../constants/capabilities";
import SafetyManagementCard from "./components/SafetyManagementCard";
import TeamTrainingOverviewCard from "./components/TeamTrainingOverviewCard";
import MyTraining from "./components/MyTraining";
import {
  ArrowRightIcon,
  BookOpenIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const MyDashboard: React.FC = () => {
  const { keycloak } = useAuth();
  const { me, canAny, labels } = useMe();

  const canViewTraining = canAny(CAP.VIEW_TRAINING);
  const canViewSafetyReports = canAny(CAP.VIEW_SAFETY_REPORTS);
  const canAdministerTraining = canAny(CAP.ADMINISTER_TRAINING);
  const hasTeamSection = canViewSafetyReports || canAdministerTraining;

  const firstName = keycloak?.tokenParsed?.given_name;
  const orgName = me?.organization?.name;
  const unitName = me?.units[0]?.name;

  // Full org + unit entities (for safety contact + policies content).
  // The header reads names from useMe() without waiting on these.
  const { data: myOrganization, isLoading: organizationLoading } = useQuery({
    queryKey: [
      "organization",
      "slug",
      keycloak!.tokenParsed!.organization,
    ] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[2]),
    enabled: !!keycloak?.tokenParsed?.organization,
  });

  const { data: myUnit, isLoading: unitLoading } = useQuery({
    queryKey: ["unit", "slug", keycloak!.tokenParsed!.unit] as const,
    queryFn: ({ queryKey }) => getUnitBySlug(queryKey[2]),
    enabled: !!keycloak?.tokenParsed?.unit,
  });

  const orgsLoading = organizationLoading || unitLoading;
  const mySafetyContact =
    myUnit?.safetyContact ?? myOrganization?.safetyContact;
  const myPoliciesAndProcedures = [
    ...(myUnit?.policiesAndProcedures ?? []),
    ...(myOrganization?.policiesAndProcedures ?? []),
  ];

  return (
    <div className="space-y-6">
      {/* Header — small welcome preamble above the H1. */}
      <header>
        {firstName && (
          <p className="font-welcome text-lg leading-none italic text-primary-600">
            Welcome, {firstName}
          </p>
        )}
        <h1
          className={`text-2xl font-semibold tracking-tight text-gray-900 ${firstName ? "mt-1" : ""}`}
        >
          My Dashboard
        </h1>
        {(unitName || orgName) && (
          <p className="mt-1 text-sm text-gray-500">
            {[unitName, orgName].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      {/* Primary CTA — compact report banner. */}
      <Link
        to="/safety-concerns"
        aria-label="Report a safety concern"
        className="group flex items-center gap-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 transition-colors hover:bg-primary-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:px-5 sm:py-4"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 ring-1 ring-primary-200"
        >
          <ShieldCheckIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 sm:text-base">
            Report a safety concern
          </div>
          <div className="truncate text-sm text-gray-600">
            See something? Say something. We&rsquo;ll route it to the right
            people.
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-primary-600 sm:inline-flex">
          Report
          <ArrowRightIcon className="h-4 w-4" />
        </span>
        <ArrowRightIcon
          aria-hidden
          className="h-5 w-5 shrink-0 text-primary-500 sm:hidden"
        />
      </Link>

      {/* Organization info — reference material first, since everyone has it. */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">
          Organization info
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 sm:divide-x sm:divide-gray-100">
          <div className="space-y-2 sm:pr-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <LifebuoyIcon aria-hidden className="h-4 w-4 text-gray-500" />
              Safety contact
            </h3>
            <div className="text-sm text-gray-700">
              {orgsLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block h-3.5 w-full animate-pulse rounded bg-gray-200/60"
                    />
                  ))}
                </div>
              ) : mySafetyContact ? (
                <SafetyContactBody value={mySafetyContact} />
              ) : (
                <span className="text-gray-500">
                  No safety contact listed for your organization yet.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 sm:pl-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <BookOpenIcon aria-hidden className="h-4 w-4 text-gray-500" />
              Policies &amp; procedures
            </h3>
            <div className="text-sm">
              {orgsLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block h-3.5 w-full animate-pulse rounded bg-gray-200/60"
                    />
                  ))}
                </div>
              ) : myPoliciesAndProcedures.length ? (
                <ul className="space-y-1">
                  {myPoliciesAndProcedures.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-secondary-700 transition-colors hover:text-secondary-800 hover:underline"
                      >
                        <DocumentTextIcon aria-hidden className="h-3.5 w-3.5" />
                        {file.name} (.pdf)
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500">
                  No policies or procedures posted yet.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* My training — everyone with view-training capability. */}
      {canViewTraining && <MyTraining />}

      {/* Divider — marks the shift from "mine" to "team & management". Label
          copy adapts to the org's vocabulary preset (e.g., schools read
          "School & management"). */}
      {hasTeamSection && (
        <div className="flex items-center gap-3 pt-2" aria-hidden>
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            {labels.teamSingular} &amp; management
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Safety management — TAT / anyone who can view reports. */}
      {canViewSafetyReports && <SafetyManagementCard />}

      {/* Team training overview — training admins. */}
      {canAdministerTraining && <TeamTrainingOverviewCard />}
    </div>
  );
};

export default MyDashboard;
