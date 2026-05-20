import { useMatches } from "react-router";

export interface BreadcrumbCrumb {
  title: string;
  pathname: string;
}

export interface PageAnchor {
  /** Deepest route's title; the current "page name." */
  title: string;
  /** Parent crumbs leading to (but excluding) the current page. */
  trail: BreadcrumbCrumb[];
}

/**
 * Resolves the top-bar page anchor from the active route's `handle.title`
 * chain. Walks the matched route hierarchy, keeps every match whose
 * handle exposes a string `title`, and splits the deepest off as the
 * page title with the rest forming the breadcrumb trail.
 *
 * Routes without a `handle.title` are skipped (e.g. layout-only parents)
 * so the trail never shows stutter crumbs. Falls back to "ThreatZero"
 * when nothing in the chain declares a title.
 */
export const usePageAnchor = (): PageAnchor => {
  const matches = useMatches();
  const titled = matches.flatMap((m) => {
    const t = (m.handle as { title?: string } | null)?.title;
    return t ? [{ title: t, pathname: m.pathname }] : [];
  });

  if (titled.length === 0) {
    return { title: "ThreatZero", trail: [] };
  }

  const trail = titled.slice(0, -1);
  const last = titled[titled.length - 1];
  return { title: last.title, trail };
};
