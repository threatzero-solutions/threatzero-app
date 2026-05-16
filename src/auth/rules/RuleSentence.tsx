import { useMemo } from "react";
import { AssignableRole } from "../../queries/grants";
import { Rule } from "../../queries/rules";
import { Audience, Unit } from "../../types/entities";
import { classNames } from "../../utils/core";
import { toDisplayClaimKey } from "./claim-key";
import { MATCHER_OP_VERBS } from "./rule-labels";
import { buildUnitLabelMap } from "./unit-options";

interface RuleSentenceProps {
  rule: Rule;
  units: Unit[];
  roles: AssignableRole[];
  audiences: Audience[];
  orgLabel: string;
  /**
   * When a rule is disabled we want the eye to register "this sentence
   * still exists but isn't running" — not "loading" or "broken". Strikes
   * through operator badges and desaturates tokens instead of washing the
   * whole line out with opacity.
   */
  disabled?: boolean;
}

export function RuleSentence({
  rule,
  units,
  roles,
  audiences,
  orgLabel,
  disabled = false,
}: RuleSentenceProps) {
  const unitLabels = useMemo(() => buildUnitLabelMap(units), [units]);
  return (
    <p
      data-disabled={disabled || undefined}
      className={classNames(
        "group/sentence text-[0.9375rem] leading-relaxed",
        disabled ? "text-gray-500" : "text-gray-700",
      )}
    >
      <WhenClause rule={rule} />
      <Connector />
      <ThenClause
        rule={rule}
        unitLabels={unitLabels}
        roles={roles}
        audiences={audiences}
        orgLabel={orgLabel}
      />
    </p>
  );
}

function WhenClause({ rule }: { rule: Rule }) {
  if (rule.trigger.kind === "always") {
    return <span>For every user,</span>;
  }
  const { claimKey, matcher } = rule.trigger;
  return (
    <>
      <span>When the </span>
      <Token>{toDisplayClaimKey(claimKey)}</Token>
      <span> claim </span>
      <MatchOp>{MATCHER_OP_VERBS[matcher.op]}</MatchOp>{" "}
      <ValueList values={matcher.values} />
      {matcher.caseInsensitive ? (
        <span> (any letter case),</span>
      ) : (
        <span>,</span>
      )}
    </>
  );
}

function ThenClause({
  rule,
  unitLabels,
  roles,
  audiences,
  orgLabel,
}: {
  rule: Rule;
  unitLabels: Map<string, string>;
  roles: AssignableRole[];
  audiences: Audience[];
  orgLabel: string;
}) {
  const unitName = (id: string) => unitLabels.get(id) ?? "unknown unit";
  const roleName = (slug: string) =>
    roles.find((r) => r.slug === slug)?.name ?? slug;
  const audienceName = (id: string) =>
    audiences.find((a) => a.id === id)?.slug ?? "unknown training group";

  const e = rule.effect;
  if (e.kind === "grant-role") {
    return (
      <>
        <ActionOp kind="grant-role">grant</ActionOp>{" "}
        <Token>{roleName(e.roleSlug)}</Token>
        <TargetPhrase
          target={e.target}
          orgLabel={orgLabel}
          unitName={unitName}
        />
        <span>.</span>
      </>
    );
  }
  if (e.kind === "set-residence") {
    return (
      <>
        <ActionOp kind="set-residence">set their home</ActionOp>{" "}
        {e.target.kind === "fixed-unit" ? (
          <>
            <span>to </span>
            <Token>{unitName(e.target.unitId)}</Token>
          </>
        ) : (
          <>
            <span>to the unit named in the </span>
            <Token>{toDisplayClaimKey(e.target.claimKey)}</Token>
            <span> claim</span>
          </>
        )}
        <span>.</span>
      </>
    );
  }
  return (
    <>
      <ActionOp kind="join-audience">add them to</ActionOp>{" "}
      <Token>{audienceName(e.audienceId)}</Token>
      <span>.</span>
    </>
  );
}

type AnyTarget =
  | { kind: "org" }
  | { kind: "fixed-unit"; unitId: string }
  | { kind: "unit-from-claim"; claimKey: string };

function TargetPhrase({
  target,
  orgLabel,
  unitName,
}: {
  target: AnyTarget;
  orgLabel: string;
  unitName: (id: string) => string;
}) {
  if (target.kind === "org")
    return (
      <>
        <span> across </span>
        <Token>{orgLabel}</Token>
      </>
    );
  if (target.kind === "fixed-unit")
    return (
      <>
        <span> in </span>
        <Token>{unitName(target.unitId)}</Token>
      </>
    );
  return (
    <>
      <span> in the unit named by the </span>
      <Token>{toDisplayClaimKey(target.claimKey)}</Token>
      <span> claim</span>
    </>
  );
}

function ValueList({ values }: { values: string[] }) {
  if (values.length === 1) return <Token>{values[0]}</Token>;
  if (values.length === 2)
    return (
      <>
        <Token>{values[0]}</Token>
        <span> or </span>
        <Token>{values[1]}</Token>
      </>
    );
  return (
    <>
      {values.slice(0, -1).map((v, i) => (
        <span key={i}>
          <Token>{v}</Token>
          <span>, </span>
        </span>
      ))}
      <span>or </span>
      <Token>{values[values.length - 1]}</Token>
    </>
  );
}

// The badge treatments check the nearest ancestor's `data-disabled` so the
// disabled prop propagates without threading through every helper.
// MatchOp (WHEN) is syntax — kept neutral. ActionOp (THEN) carries meaning,
// tinted per effect kind so the list is scannable at a glance.

const BADGE_BASE =
  "font-semibold uppercase tracking-wider text-[0.75rem] rounded px-1.5 py-0.5 align-[0.08em] group-data-[disabled]/sentence:text-gray-500 group-data-[disabled]/sentence:bg-gray-100 group-data-[disabled]/sentence:ring-0 group-data-[disabled]/sentence:line-through";

const MatchOp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className={`${BADGE_BASE} bg-gray-100 text-gray-700`}>{children}</span>
);

// Explicit per-kind classes so Tailwind's JIT can see the full strings.
const ACTION_TINTS: Record<string, string> = {
  "grant-role": "bg-primary-50 text-primary-800 ring-1 ring-primary-200/70",
  "set-residence": "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
  "join-audience":
    "bg-secondary-50 text-secondary-800 ring-1 ring-secondary-200/70",
};

const ActionOp: React.FC<{
  kind: "grant-role" | "set-residence" | "join-audience";
  children: React.ReactNode;
}> = ({ kind, children }) => (
  <span className={`${BADGE_BASE} ${ACTION_TINTS[kind]}`}>{children}</span>
);

const Token: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-medium text-gray-900 border-b border-dotted border-gray-400 group-data-[disabled]/sentence:text-gray-500 group-data-[disabled]/sentence:border-transparent">
    {children}
  </span>
);

const Connector = () => <span className="text-gray-400"> — </span>;
