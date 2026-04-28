import { z } from "zod";
import { CreateRuleInput, RuleEffect, RuleTrigger } from "../../queries/rules";

const matcherSchema = z.object({
  op: z.enum(["equals", "contains", "starts-with", "ends-with"]),
  values: z
    .array(z.string().trim().min(1, "Value cannot be empty"))
    .min(1, "Add at least one value"),
  caseInsensitive: z.boolean(),
});

const triggerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("always") }),
  z.object({
    kind: z.literal("claim-match"),
    claimKey: z.string().trim().min(1, "Claim name is required"),
    matcher: matcherSchema,
  }),
]);

// unit-from-claim targets are intentionally omitted from the UI in v1 — the
// chance that an SSO claim value reliably matches our internal unit slugs
// is near zero, so exposing it sets admins up to fail. Re-add when we have
// a real identity-provider that needs it.
const grantTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("org") }),
  z.object({
    kind: z.literal("fixed-unit"),
    unitId: z.string().uuid("Choose a unit"),
  }),
]);

const residenceTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fixed-unit"),
    unitId: z.string().uuid("Choose a unit"),
  }),
]);

const effectSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("grant-role"),
    roleSlug: z.string().min(1, "Pick a role"),
    target: grantTargetSchema,
  }),
  z.object({
    kind: z.literal("set-residence"),
    target: residenceTargetSchema,
  }),
  z.object({
    kind: z.literal("join-audience"),
    audienceId: z.string().uuid("Pick a training group"),
  }),
]);

export const ruleFormSchema = z.object({
  trigger: triggerSchema,
  effect: effectSchema,
  disabled: z.boolean().optional(),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const emptyTrigger: RuleTrigger = { kind: "always" };

export const emptyGrantRole: RuleEffect = {
  kind: "grant-role",
  roleSlug: "",
  target: { kind: "org" },
};

export const emptyRule: CreateRuleInput = {
  trigger: emptyTrigger,
  effect: emptyGrantRole,
  disabled: false,
};
