/**
 * Chrome footer. One quiet warm strip pinned at the bottom of every
 * authenticated page: copyright on the left, support email + build
 * version on the right. No logo, no tagline, no social.
 *
 * The build version is the short git SHA injected by Vite (see
 * `vite.config.ts`), surfaced so a user can quote it on a support
 * ticket. When ThreatZero introduces a public status page, the
 * footer's right side gains a third link; until then the brief
 * deferred the slot.
 */
import { CONTACT_EMAIL } from "../../constants/core";

const Footer: React.FC = () => {
  return (
    <footer className="px-4 lg:px-8 py-4 mt-12 border-t border-warm-200 flex flex-wrap items-center justify-between gap-2 text-xs text-secondary-500">
      <span>© {new Date().getFullYear()} ThreatZero Solutions</span>
      <div className="flex items-center gap-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="hover:text-secondary-700 transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
        <span aria-hidden="true" className="text-secondary-300">
          ·
        </span>
        <span className="text-secondary-400 font-mono text-[11px]">
          {__APP_VERSION__}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
