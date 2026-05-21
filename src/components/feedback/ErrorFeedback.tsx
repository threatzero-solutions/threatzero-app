/**
 * Lets a user describe what they were doing when an error hit. The note is
 * sent to Sentry via `captureFeedback` and, when an `eventId` is known,
 * linked to that exact error event — so the report and the user's words
 * land on the same Sentry issue.
 *
 * When the error is a known, captured one (`eventId` present), the form
 * opens by default: that's the moment a report is most valuable, so we
 * don't make the user find a trigger first. Otherwise a quiet trigger
 * stands in until they choose to open it.
 *
 * Motion: phases (trigger / form / sent) cross-fade with a settling slide,
 * and the surrounding layout eases as the panel resizes — so reporting an
 * error never snaps. All motion collapses under `prefers-reduced-motion`.
 */
import { useState } from "react";
import * as Sentry from "@sentry/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChatText, CheckCircle, PaperPlaneRight } from "@phosphor-icons/react";

interface ErrorFeedbackProps {
  /** Ties the feedback to a specific Sentry error event when available. */
  eventId?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "mt-2 block w-full rounded-lg border-warm-300 text-sm text-secondary-900 transition-colors placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500";

// ease-out-quint — confident deceleration, no bounce.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ eventId }) => {
  const [open, setOpen] = useState(Boolean(eventId));
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const reduce = useReducedMotion();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    try {
      Sentry.captureFeedback({
        message: trimmed,
        email: email.trim() || undefined,
        associatedEventId: eventId,
        source: "error-page",
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const enterT = reduce ? { duration: 0 } : { duration: 0.22, ease: EASE };
  const exitT = reduce ? { duration: 0 } : { duration: 0.16, ease: EASE };
  const layoutT = reduce ? { duration: 0 } : { duration: 0.26, ease: EASE };

  const phase = status === "sent" ? "sent" : open ? "form" : "trigger";

  return (
    <motion.div layout transition={layoutT} className="mt-8">
      <AnimatePresence mode="wait" initial={false}>
        {phase === "trigger" && (
          <motion.button
            key="trigger"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={enterT}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-semibold text-secondary-700 transition-colors hover:bg-warm-200/60 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <ChatText size={16} weight="regular" aria-hidden="true" />
            Tell us what happened
          </motion.button>
        )}

        {phase === "form" && (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: exitT }}
            transition={enterT}
            className="max-w-md"
          >
            <label
              htmlFor="error-feedback-message"
              className="block text-sm font-semibold text-secondary-800"
            >
              What were you doing when this happened?
            </label>
            <p className="mt-1 text-xs text-secondary-500">
              Optional, but it helps us pin down the cause.
            </p>
            <textarea
              id="error-feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. I clicked Save on the training section and the page froze."
              className={fieldClass}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional, so we can follow up)"
              className={fieldClass}
            />
            {status === "error" && (
              <p className="mt-2 text-xs font-medium text-danger-600">
                That didn't send. Please try again.
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={!message.trim() || status === "sending"}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PaperPlaneRight size={15} weight="bold" aria-hidden="true" />
                {status === "sending" ? "Sending…" : "Send feedback"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-sm font-semibold text-secondary-500 transition-colors hover:text-secondary-800"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {phase === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enterT}
            className="flex items-center gap-2 text-sm text-secondary-700"
          >
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.32, ease: EASE, delay: 0.05 }
              }
              className="inline-flex"
            >
              <CheckCircle
                size={20}
                weight="fill"
                aria-hidden="true"
                className="text-success-600"
              />
            </motion.span>
            Thanks, that detail helps us track it down.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ErrorFeedback;
