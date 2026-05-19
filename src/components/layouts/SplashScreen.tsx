/**
 * Pre-app loading screen shown while keycloak.init() and the first /me
 * request are in flight. Warm cream backdrop matches the app's loaded
 * chrome so there's no color shift on hand-off. The canonical Wordmark
 * gives the brand a moment to land, and a thin brand-orange ring
 * pulses softly underneath as the only motion cue. Keyframes +
 * reduced-motion guard live in `src/index.css`.
 */
import Wordmark from "../brand/Wordmark";

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-10 bg-warm-50">
      <Wordmark size="lg" />
      <div
        aria-hidden="true"
        className="tz-splash-pulse h-3 w-3 rounded-full border-2 border-primary-400"
      />
      <span className="sr-only" role="status">
        Loading ThreatZero
      </span>
    </div>
  );
};

export default SplashScreen;
