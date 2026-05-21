import { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import BackButtonLink from "../../components/layouts/BackButtonLink";
import { trainingItemPermissionsOptions } from "../../constants/permission-options";
import { TrainingContext } from "../../contexts/training/training-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { getTrainingSection } from "../../queries/training";
import { orderSort } from "../../utils/core";
import { getSectionAndWindowBySectionIdWithPreviousAndNext } from "../../utils/training";
import {
  SectionNotFound,
  SectionSkeleton,
} from "./components/library/LibraryStates";
import SectionItemRow from "./components/library/SectionItemRow";
import SectionNav from "./components/library/SectionNav";
import { formatWindow, stripHtml } from "./components/library/useLibraryCourse";

/**
 * A training section: the items within it, shown as a guided checklist
 * with per-item completion, plus previous/next section navigation.
 * Single-item sections redirect straight to the player.
 */
const ViewTrainingSection: React.FC = withRequirePermissions(() => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useContext(TrainingContext);

  const { data: section, isPending } = useQuery({
    queryKey: ["traning-section", sectionId],
    queryFn: ({ queryKey }) => getTrainingSection(queryKey[1] ?? undefined),
    enabled: !!sectionId,
  });

  const isSingleItem = (section?.items?.length ?? 0) === 1;

  // A section with one item is just that item — skip the list entirely.
  useEffect(() => {
    if (section && isSingleItem && section.items) {
      navigate(
        `/training/library/items/${section.items[0].item.id}?sectionId=${section.id}`,
        { replace: true, state: location.state },
      );
    }
  }, [section, isSingleItem, navigate, location.state]);

  const { matching, previous, next } = useMemo(
    () =>
      getSectionAndWindowBySectionIdWithPreviousAndNext(
        sectionId ?? "",
        state.activeEnrollment,
        state.activeCourse?.sections ?? [],
      ),
    [sectionId, state.activeEnrollment, state.activeCourse],
  );

  const items = useMemo(
    () => (section?.items ?? []).slice().sort(orderSort),
    [section],
  );

  const completions = state.itemCompletionsMap;
  const completedCount = useMemo(
    () =>
      items.filter((si) => completions?.get(si.item?.id ?? "")?.completed)
        .length,
    [items, completions],
  );

  const dateRange = formatWindow(matching?.window ?? null);
  const progressPct =
    items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <BackButtonLink to="/training/library" value="Training library" />

      {isPending || isSingleItem ? (
        <SectionSkeleton />
      ) : !section ? (
        <SectionNotFound />
      ) : (
        <>
          <header className="mb-6">
            {dateRange && (
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                {dateRange}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-secondary-900">
              {stripHtml(section.metadata?.title) || "Training section"}
            </h1>
            {stripHtml(section.metadata?.description) && (
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-secondary-600">
                {stripHtml(section.metadata?.description)}
              </p>
            )}

            {items.length > 1 && (
              <div className="mt-4 max-w-xs">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <span
                    className="block h-full rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-medium text-secondary-500">
                  <span className="font-semibold tabular-nums text-secondary-700">
                    {completedCount}
                  </span>{" "}
                  of {items.length} complete
                </p>
              </div>
            )}
          </header>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-warm-50 px-4 py-8 text-center text-sm text-secondary-500">
              This section has no items yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {items.map((si) => (
                <SectionItemRow
                  key={si.id}
                  item={si.item}
                  to={`/training/library/items/${si.item.id}?sectionId=${section.id}`}
                  completion={completions?.get(si.item?.id ?? "")}
                />
              ))}
            </ol>
          )}

          <SectionNav previous={previous} next={next} />
        </>
      )}
    </div>
  );
}, trainingItemPermissionsOptions);

export default ViewTrainingSection;
