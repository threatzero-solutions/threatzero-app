import { MatcherOp } from "./matcher-builder";

export const MATCHER_OP_VERBS: Record<MatcherOp, string> = {
  equals: "is exactly",
  contains: "contains",
  "starts-with": "starts with",
  "ends-with": "ends with",
};

export const MATCHER_OP_HINTS: Record<MatcherOp, string> = {
  equals: "The claim value must match one of the listed values exactly.",
  contains: "The listed text appears anywhere inside the claim value.",
  "starts-with": "The claim value begins with the listed text.",
  "ends-with": "The claim value ends with the listed text.",
};

export const EFFECT_KIND_LABELS = {
  "grant-role": "Grant a role",
  "set-residence": "Set their home unit",
  "join-audience": "Add to a training group",
} as const;

export const EFFECT_KIND_DESCRIPTIONS = {
  "grant-role": "Give the user a role in this org or a specific unit.",
  "set-residence": "Mark a unit as the user’s home — where they belong.",
  "join-audience":
    "Add the user to a training group so they receive its courses.",
} as const;
