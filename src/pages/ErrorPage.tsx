/**
 * Renders when an uncaught error reaches the root error boundary or a
 * router `errorElement`. The page does three things:
 *
 *   1. Reassure — a warm surface that matches the rest of the chrome so
 *      the user doesn't feel dumped into a stark error screen.
 *   2. Offer recovery — "Take me home" is the primary action; the
 *      support link is right next to it.
 *   3. Carry the receipt — build SHA + Sentry event id at the bottom so
 *      a user (or our support team) can correlate the report.
 *
 * Acceptable as a Sentry.ErrorBoundary fallback (it picks up
 * `eventId` / `error` / `resetError`) and as a router `errorElement`
 * (no props — `useRouteError` fills in `error`).
 */
import { ArrowRight, Lifebuoy, WarningCircle } from "@phosphor-icons/react";
import { Link, useRouteError } from "react-router";
import Logo from "../components/brand/Logo";
import ErrorFeedback from "../components/feedback/ErrorFeedback";

declare const __APP_VERSION__: string;

interface ErrorPageProps {
  error?: unknown;
  eventId?: string;
  friendlyErrorMessage?: string;
  resetError?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  eventId,
  friendlyErrorMessage,
  resetError,
}) => {
  const routerError = useRouteError();
  const surfacedError = error ?? routerError;

  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <Logo size="md" variant="lockup" className="h-14 w-auto" />
          <WarningCircle
            size={40}
            weight="regular"
            aria-hidden="true"
            className="mt-12 text-primary-500"
          />
          <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight text-secondary-900">
            Something didn't load right.
          </h1>
          <p className="mt-3 text-base leading-7 text-secondary-600">
            {friendlyErrorMessage ??
              "We hit an unexpected error rendering this page. The team has been notified, so there's nothing you need to do."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              onClick={resetError}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors"
            >
              Take me home
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-secondary-700 hover:bg-warm-200/60 transition-colors"
            >
              <Lifebuoy size={16} weight="regular" aria-hidden="true" />
              Contact support
            </Link>
          </div>

          <ErrorFeedback eventId={eventId} />

          <dl className="mt-12 pt-6 border-t border-warm-200 grid grid-cols-1 gap-y-3 text-xs text-secondary-500 sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="uppercase tracking-wider font-medium text-secondary-400">
              Build
            </dt>
            <dd className="font-mono">{__APP_VERSION__}</dd>
            {eventId ? (
              <>
                <dt className="uppercase tracking-wider font-medium text-secondary-400">
                  Reference
                </dt>
                <dd className="font-mono break-all">{eventId}</dd>
              </>
            ) : null}
            {surfacedError instanceof Error && surfacedError.message ? (
              <>
                <dt className="uppercase tracking-wider font-medium text-secondary-400">
                  Detail
                </dt>
                <dd className="break-words">{surfacedError.message}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage;
