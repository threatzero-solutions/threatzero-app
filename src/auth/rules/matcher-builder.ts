/**
 * Beginner-friendly trigger authoring. Org admins compose rule triggers
 * from an operator + value list; we compile that to the regex the API
 * evaluator actually runs. Raw regex is never shown in the UI.
 *
 * Keep this file in lockstep with
 * `threatzero-api/src/auth/rules/matcher-builder.ts` — identical logic.
 * The API validates stored `triggerPattern` against its own compiler at
 * write time, so any drift is caught.
 */

export type MatcherOp = "equals" | "contains" | "starts-with" | "ends-with";

export interface MatcherBuilder {
  op: MatcherOp;
  values: string[];
  caseInsensitive: boolean;
}

export class MatcherBuilderError extends Error {}

function escapeRegex(input: string): string {
  return input.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&");
}

function assertValues(values: string[], op: MatcherOp): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new MatcherBuilderError(`matcher ${op}: at least one value required`);
  }
  const out: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") {
      throw new MatcherBuilderError(`matcher ${op}: values must be strings`);
    }
    const v = raw.trim();
    if (!v) {
      throw new MatcherBuilderError(`matcher ${op}: empty values not allowed`);
    }
    out.push(v);
  }
  return out;
}

export function compileMatcher(builder: MatcherBuilder): string {
  if (!builder || typeof builder !== "object") {
    throw new MatcherBuilderError("matcher: missing builder");
  }
  const values = assertValues(builder.values, builder.op);
  const flag = builder.caseInsensitive ? "(?i)" : "";
  const escaped = values.map(escapeRegex);

  switch (builder.op) {
    case "equals":
      return `${flag}^(?:${escaped.join("|")})$`;
    case "contains":
      return `${flag}^.*(?:${escaped.join("|")}).*$`;
    case "starts-with":
      return `${flag}^(?:${escaped.join("|")}).*$`;
    case "ends-with":
      return `${flag}^.*(?:${escaped.join("|")})$`;
    default: {
      const _exhaustive: never = builder.op;
      throw new MatcherBuilderError(`matcher: unknown op ${_exhaustive}`);
    }
  }
}

export function toJsRegex(pattern: string): RegExp {
  const ci = pattern.startsWith("(?i)");
  const body = ci ? pattern.slice(4) : pattern;
  return new RegExp(body, ci ? "i" : "");
}
