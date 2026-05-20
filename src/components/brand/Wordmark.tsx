/**
 * Canonical ThreatZero wordmark lockup.
 *
 * "ThreatZero" set in the system sans, font-semibold tracking-tight,
 * paired with a small primary-400 dot. The dot is the brand's quiet
 * confidence cue: it's the only color in the lockup, and it sits at
 * the baseline of the "o" without competing with the letterforms.
 *
 * Single source of truth for the wordmark across the app: sidebar,
 * mobile dialog, splash screen, login. Use the `size` prop instead
 * of ad-hoc class overrides so the lockup keeps consistent
 * proportions wherever it lands.
 */

interface WordmarkProps {
  /**
   * `sm` (top bar, dense chrome), `md` (sidebar default), `lg` (splash,
   * marketing surfaces). The dot scales with the text.
   */
  size?: "sm" | "md" | "lg";
  /** Hide the trailing dot. Use when the dot would distract; rare. */
  dotless?: boolean;
  className?: string;
}

const SIZE = {
  sm: { text: "text-[15px]", dot: "h-1 w-1", gap: "gap-1.5" },
  md: { text: "text-[20px]", dot: "h-1.5 w-1.5", gap: "gap-2" },
  lg: { text: "text-[34px]", dot: "h-2 w-2", gap: "gap-2.5" },
} as const;

const Wordmark: React.FC<WordmarkProps> = ({
  size = "md",
  dotless,
  className,
}) => {
  const s = SIZE[size];
  return (
    <span
      className={[
        "inline-flex items-baseline select-none",
        s.gap,
        className ?? "",
      ].join(" ")}
      aria-label="ThreatZero"
    >
      <span
        className={[
          "font-semibold tracking-tight text-secondary-900",
          s.text,
        ].join(" ")}
      >
        ThreatZero
      </span>
      {!dotless && (
        <span
          className={["rounded-full bg-primary-400", s.dot].join(" ")}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default Wordmark;
