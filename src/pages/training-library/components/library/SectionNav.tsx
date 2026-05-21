import { Link, useLocation } from "react-router";
import { SectionAndWindow } from "../../../../types/training";
import { cn } from "../../../../utils/core";
import { stripHtml } from "./useLibraryCourse";

interface SectionNavProps {
  previous: SectionAndWindow | null;
  next: SectionAndWindow | null;
}

const NavCard: React.FC<{
  sw: SectionAndWindow;
  direction: "prev" | "next";
}> = ({ sw, direction }) => {
  const location = useLocation();
  const isNext = direction === "next";

  return (
    <Link
      to={`/training/library/sections/${sw.section.id}`}
      state={{ from: location }}
      className={cn(
        "group flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-sm",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        isNext && "items-end text-right",
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-secondary-400">
        {isNext ? "Next section" : "Previous section"}
      </span>
      <span className="w-full truncate text-sm font-medium text-secondary-800">
        {stripHtml(sw.section.metadata?.title) || "Untitled section"}
      </span>
    </Link>
  );
};

/** Previous / next section links — guided-program continuity at the
 * bottom of a section page. Renders nothing when there are no siblings. */
const SectionNav: React.FC<SectionNavProps> = ({ previous, next }) => {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="mt-8 grid grid-cols-2 gap-3 border-t border-gray-200 pt-6"
    >
      {previous ? (
        <NavCard sw={previous} direction="prev" />
      ) : (
        <span aria-hidden />
      )}
      {next ? <NavCard sw={next} direction="next" /> : <span aria-hidden />}
    </nav>
  );
};

export default SectionNav;
