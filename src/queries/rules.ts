/**
 * Queries + mutations against the rules endpoints
 * (`/api/organizations/organizations/:orgId/rules`). Authored rules drive
 * the DB-native role-granting evaluator — see
 * `_docs/idp-role-claims-plan.md`.
 */
import { MatcherBuilder } from "../auth/rules/matcher-builder";
import {
  deleteOne,
  findOneByIdOrFail,
  findOneOrFail,
  insertOne,
  updateOne,
} from "./utils";

export type RuleOwnerKind = "organization" | "system";
export type RuleTriggerKind = "always" | "claim-match";

export type RuleTrigger =
  | { kind: "always" }
  | { kind: "claim-match"; claimKey: string; matcher: MatcherBuilder };

export type GrantTarget =
  | { kind: "org" }
  | { kind: "fixed-unit"; unitId: string }
  | { kind: "unit-from-claim"; claimKey: string };

export type ResidenceTarget =
  | { kind: "fixed-unit"; unitId: string }
  | { kind: "unit-from-claim"; claimKey: string };

export type RuleEffect =
  | { kind: "grant-role"; roleSlug: string; target: GrantTarget }
  | { kind: "set-residence"; target: ResidenceTarget }
  | { kind: "join-audience"; audienceId: string };

export interface Rule {
  id: string;
  ownerKind: RuleOwnerKind;
  ownerOrgId: string | null;
  trigger: RuleTrigger;
  effect: RuleEffect;
  disabled: boolean;
  createdByUserId: string | null;
  createdOn: string;
  updatedOn: string;
}

export interface CreateRuleInput {
  trigger: RuleTrigger;
  effect: RuleEffect;
  disabled?: boolean;
}

export type UpdateRuleInput = Partial<CreateRuleInput>;

const rulesPath = (orgId: string, sub = "") =>
  `organizations/organizations/${orgId}/rules${sub}`;

export const getRules = (orgId: string) =>
  findOneOrFail<Rule[]>(rulesPath(orgId));

export const getRule = (orgId: string, ruleId: string) =>
  findOneByIdOrFail<Rule>(rulesPath(orgId), ruleId);

export const createRule = (orgId: string, input: CreateRuleInput) =>
  insertOne<Rule, Rule>(rulesPath(orgId), input as never);

export const updateRule = (
  orgId: string,
  ruleId: string,
  input: UpdateRuleInput,
) =>
  updateOne<Rule>(rulesPath(orgId), {
    id: ruleId,
    ...(input as object),
  } as never);

export const deleteRule = (orgId: string, ruleId: string) =>
  deleteOne(rulesPath(orgId), ruleId);

export const rulesKey = (orgId: string) => ["rules", orgId] as const;

export type { MatcherBuilder } from "../auth/rules/matcher-builder";
