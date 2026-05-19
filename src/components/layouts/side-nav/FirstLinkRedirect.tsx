/**
 * Lands users without an explicit route at the first nav item they're
 * permitted to see. A teacher with only `view-training` ends up at the
 * Training Library; an admin lands at "My Dashboard". Without this, the
 * dashboard root rendered blank for low-permission users while the
 * sidebar showed them options behind a click.
 *
 * Reads the canonical chrome nav so the redirect target tracks the nav
 * config.
 */
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { CHROME_NAV, ChromeNavItem } from "../../chrome/nav-config";
import { useNav } from "../../../utils/navigation";

const firstReachable = (items: ChromeNavItem[]): string | null => {
  for (const item of items) {
    if (item.to) return item.to;
    if (item.children?.length) {
      const childWithTo = item.children.find((c) => c.to);
      if (childWithTo?.to) return childWithTo.to;
    }
  }
  return null;
};

const FirstLinkRedirect: React.FC = () => {
  const { canNavigate, filterByPermissions } = useNav();
  const navigate = useNavigate();

  const target = useMemo(() => {
    const permitted = (CHROME_NAV as ChromeNavItem[])
      .filter(canNavigate)
      .map(filterByPermissions) as ChromeNavItem[];
    return firstReachable(permitted);
  }, [canNavigate, filterByPermissions]);

  useEffect(() => {
    if (target) navigate(target);
  }, [navigate, target]);

  return null;
};

export default FirstLinkRedirect;
