/**
 * ThreatZero logo. Three variants pull from real brand assets:
 *
 * - `lockup`  — the canonical TZ_logo PNG (mark + wordmark, full
 *   brand asset). Use when the brand needs to land at full force
 *   (splash, login).
 * - `mark`    — the compact TZ shield (logo150.png), the standalone
 *   brand mark. Use when the chrome needs a brand cue at small size
 *   without the full lockup competing with typography.
 * - `mark-text` — the compact TZ shield paired with "ThreatZero"
 *   wordmark text in the chrome's system sans. The chrome default.
 *
 * One canonical place for the logo. Sidebar, mobile dialog, splash,
 * and login all reach in here. Swap variants here, not at call sites.
 */
interface LogoProps {
  /** Size token. `sm` ~28px, `md` ~32px, `lg` ~80px tall. */
  size?: "sm" | "md" | "lg";
  variant?: "lockup" | "mark" | "mark-text";
  className?: string;
}

const LOCKUP_SIZE = {
  sm: "h-7",
  md: "h-10",
  lg: "h-20",
} as const;

const MARK_SIZE = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-14 w-14",
} as const;

const MARK_TEXT_TEXT = {
  sm: "text-[15px]",
  md: "text-[18px]",
  lg: "text-[28px]",
} as const;

const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "mark-text",
  className,
}) => {
  if (variant === "lockup") {
    return (
      <img
        src="/TZ_logo.png"
        alt="ThreatZero"
        draggable={false}
        className={[
          "w-auto select-none object-contain",
          LOCKUP_SIZE[size],
          className ?? "",
        ].join(" ")}
      />
    );
  }

  if (variant === "mark") {
    return (
      <img
        src="/logo150.png"
        alt="ThreatZero"
        draggable={false}
        className={[
          "shrink-0 select-none object-contain",
          MARK_SIZE[size],
          className ?? "",
        ].join(" ")}
      />
    );
  }

  // mark + text
  return (
    <span
      className={[
        "inline-flex items-center gap-2.5 select-none",
        className ?? "",
      ].join(" ")}
      aria-label="ThreatZero"
    >
      <img
        src="/logo150.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={["shrink-0 object-contain", MARK_SIZE[size]].join(" ")}
      />
      <span
        className={[
          "font-semibold tracking-tight text-secondary-900",
          MARK_TEXT_TEXT[size],
        ].join(" ")}
      >
        ThreatZero
      </span>
    </span>
  );
};

export default Logo;
