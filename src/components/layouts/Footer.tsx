/**
 * Chrome footer. A calm warm strip at the bottom of every
 * authenticated page: a small TZ shield, copyright, and a contact
 * group (email + phone) that gives users a real path off the product
 * if they need help.
 *
 * No marketing tagline, no social tiles, no logo lockup. The full
 * brand surface lives in the marketing site; the chrome's footer is
 * for trust and service.
 */
import { EnvelopeSimple, Phone } from "@phosphor-icons/react";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_NUMBER,
  CONTACT_PHONE_NUMBER_FORMATTED,
} from "../../constants/core";

const Footer: React.FC = () => {
  return (
    <footer className="px-4 lg:px-8 py-5 mt-12 border-t border-warm-200 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary-500">
      <div className="flex items-center gap-2.5">
        <img
          src="/logo150.png"
          alt=""
          aria-hidden="true"
          className="h-6 w-6 select-none object-contain"
          draggable={false}
        />
        <span>© {new Date().getFullYear()} ThreatZero Solutions</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-1.5 hover:text-secondary-700 transition-colors"
        >
          <EnvelopeSimple
            size={14}
            weight="regular"
            aria-hidden="true"
            className="text-secondary-400"
          />
          {CONTACT_EMAIL}
        </a>
        <a
          href={`tel:${CONTACT_PHONE_NUMBER}`}
          className="inline-flex items-center gap-1.5 hover:text-secondary-700 transition-colors"
        >
          <Phone
            size={14}
            weight="regular"
            aria-hidden="true"
            className="text-secondary-400"
          />
          {CONTACT_PHONE_NUMBER_FORMATTED}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
