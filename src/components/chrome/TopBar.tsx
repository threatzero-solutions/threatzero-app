/**
 * Top bar. White surface anchored above the cream content area, with
 * the page anchor on the left, the search launcher in the middle-right,
 * and the identified Account button on the right.
 *
 * The page anchor stacks the breadcrumb above the page title. The
 * breadcrumb is the *route* (Admin Panel / Organizations) and the title
 * is the *thing* the user is on (Caldwell School District). Both are
 * resolved from `usePageAnchor`, which walks `useMatches()` and keeps
 * only matches whose `handle` declares a `title`.
 *
 * The search input here is a launcher: clicking it (or pressing Cmd-K
 * anywhere) opens the real CommandPalette. The visible input is
 * read-only so users don't get a phantom keyboard buffer outside the
 * palette.
 */
import { Link } from "react-router";
import { usePageAnchor } from "../../hooks/use-page-anchor";
import AccountMenu from "./AccountMenu";
import { Bars, MagnifyingGlass } from "./icons";

interface TopBarProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar, onOpenSearch }) => {
  const { title, trail } = usePageAnchor();

  return (
    <header
      className="sticky top-0 z-30 h-16 bg-white border-b border-warm-200 flex items-center gap-3 lg:gap-6 px-4 lg:px-7"
      role="banner"
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="lg:hidden -ml-2 p-2 rounded-md text-secondary-700 hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars size={22} weight="regular" aria-hidden="true" />
      </button>

      {/* Page anchor: breadcrumb above title */}
      <div className="min-w-0 flex-1 lg:flex-none">
        {trail.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 text-xs text-secondary-500"
          >
            {trail.map((crumb, i) => (
              <span key={crumb.pathname} className="flex items-center gap-1.5">
                <Link
                  to={crumb.pathname}
                  className="hover:text-secondary-700 transition-colors"
                >
                  {crumb.title}
                </Link>
                {i < trail.length - 1 && (
                  <span className="text-secondary-300">/</span>
                )}
              </span>
            ))}
            {trail.length > 0 && <span className="text-secondary-300">/</span>}
          </nav>
        )}
        <h1 className="text-[15px] font-semibold tracking-tight text-secondary-900 truncate">
          {title}
        </h1>
      </div>

      <div className="hidden lg:block flex-1" />

      {/* Search launcher */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden md:inline-flex h-9 w-80 max-w-[40vw] items-center gap-2 px-3 rounded-lg bg-warm-50 border border-warm-200 text-sm text-secondary-500 hover:border-warm-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 transition-colors"
      >
        <MagnifyingGlass
          size={16}
          weight="regular"
          className="text-secondary-400 shrink-0"
          aria-hidden="true"
        />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-white border border-warm-200 text-secondary-500">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={onOpenSearch}
        className="md:hidden p-2 rounded-md text-secondary-700 hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
      >
        <span className="sr-only">Open search</span>
        <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
      </button>

      <AccountMenu />
    </header>
  );
};

export default TopBar;
