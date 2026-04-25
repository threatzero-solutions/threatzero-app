import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
// motion.form was animating just opacity during exit, which left a gap
// at the element's full height until AnimatePresence finished. Height
// is now owned by <Collapsible> on the outside.

import FormField from "../../components/forms/FormField";
import Input from "../../components/forms/inputs/Input";
import Select from "../../components/forms/inputs/Select";
import Toggle from "../../components/forms/inputs/Toggle";
import { AssignableRole } from "../../queries/grants";
import { CreateRuleInput, Rule, RuleEffect } from "../../queries/rules";
import { Audience, Unit } from "../../types/entities";
import { classNames } from "../../utils/core";
import { AudienceSelect } from "./AudienceSelect";
import { ChipInput } from "./ChipInput";
import { toDisplayClaimKey, toFullClaimKey } from "./claim-key";
import { Collapsible } from "./Collapsible";
import { MatcherOp } from "./matcher-builder";
import {
  EFFECT_KIND_DESCRIPTIONS,
  EFFECT_KIND_LABELS,
  MATCHER_OP_HINTS,
  MATCHER_OP_VERBS,
} from "./rule-labels";
import {
  emptyGrantRole,
  RuleFormValues,
  ruleFormSchema,
} from "./rule-form-schema";
import { Segmented } from "./Segmented";
import { buildUnitOptions } from "./unit-options";

interface RuleEditorProps {
  initial?: Rule;
  units: Unit[];
  roles: AssignableRole[];
  activeAudiences: Audience[];
  inactiveAudiences: Audience[];
  showInactiveAudiences: boolean;
  /**
   * When false, the "When a claim matches" trigger is hidden and every
   * new rule starts with `kind="always"`. Existing claim-match rules stay
   * editable either way so nothing orphans if an org removes its IDP later.
   */
  hasIdp: boolean;
  /**
   * Claim keys the org's IDPs are configured to forward, in their full
   * `tz.idp.*` form. The editor strips the prefix for the datalist so
   * admins pick from short names; free text is still accepted and is
   * re-prefixed before submit.
   */
  knownClaimKeys?: string[];
  orgLabel: string;
  /**
   * `standalone` adds its own ring/shadow (used for "new" above the list);
   * `nested` is for the editor rendered inside an already-ringed list row
   * — it becomes a tinted panel with no ring to avoid shadow-on-shadow.
   */
  chrome?: "standalone" | "nested";
  onCancel: () => void;
  onSubmit: (payload: CreateRuleInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

const OPS: MatcherOp[] = ["equals", "starts-with", "ends-with", "contains"];

// Fast cross-fade used for same-slot content swaps (e.g. effect-kind
// morph). Height is handled by the parent `<motion.div layout>`, so
// individual children only animate opacity.
const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const },
} as const;

export function RuleEditor({
  initial,
  units,
  roles,
  activeAudiences,
  inactiveAudiences,
  showInactiveAudiences,
  hasIdp,
  knownClaimKeys = [],
  orgLabel,
  chrome = "standalone",
  onCancel,
  onSubmit,
  submitting,
  submitError,
}: RuleEditorProps) {
  const defaultValues: RuleFormValues = initial
    ? {
        trigger: initial.trigger as RuleFormValues["trigger"],
        effect: initial.effect as RuleFormValues["effect"],
        disabled: initial.disabled,
      }
    : {
        trigger: { kind: "always" },
        effect: emptyGrantRole as RuleFormValues["effect"],
        disabled: false,
      };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues,
  });

  const trigger = useWatch({ control, name: "trigger" });
  const effect = useWatch({ control, name: "effect" });

  // Datalist options: strip the namespace so admins pick from short
  // names ("department") instead of the namespaced form they never
  // need to see.
  const knownClaimShortNames = useMemo(
    () =>
      Array.from(
        new Set(knownClaimKeys.map((k) => toDisplayClaimKey(k))),
      ).sort(),
    [knownClaimKeys],
  );

  const panelCx =
    chrome === "standalone"
      ? "rounded-lg bg-white ring-1 ring-gray-900/5 p-5"
      : "rounded-md bg-gray-50 p-4";

  return (
    <form onSubmit={handleSubmit((vals) => onSubmit(vals as CreateRuleInput))}>
      <div className={classNames(panelCx, "space-y-6")}>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {initial ? "Edit rule" : "New rule"}
          </h3>
        </div>

        {/* WHEN — the trigger-kind toggle is only useful when there's an
             IDP. When there isn't, "Every user" is the only meaningful
             option, so we skip the chrome entirely unless the rule being
             edited is already claim-match (preserve existing data). */}
        <div className="space-y-4">
          {(hasIdp || trigger.kind === "claim-match") && (
            <Segmented
              groupId="trigger-kind"
              ariaLabel="When the rule applies"
              value={trigger.kind}
              options={[
                { value: "always", label: "Every user" },
                { value: "claim-match", label: "When a claim matches" },
              ]}
              onChange={(v) => {
                if (v === "always") setValue("trigger", { kind: "always" });
                else
                  setValue("trigger", {
                    kind: "claim-match",
                    claimKey: "",
                    matcher: {
                      op: "equals",
                      values: [],
                      caseInsensitive: true,
                    },
                  });
              }}
            />
          )}

          <AnimatePresence initial={false}>
            {trigger.kind === "claim-match" && (
              <Collapsible key="claim-match-wrap">
                <div className="space-y-4 pt-2">
                  <FormField
                    field={{
                      label: "Claim name",
                      helpText:
                        knownClaimShortNames.length > 0
                          ? "Pick one your identity provider forwards, or type a custom key."
                          : "The key used in the ID token from your identity provider.",
                    }}
                    input={
                      <Controller
                        control={control}
                        name="trigger.claimKey"
                        render={({ field }) => (
                          <>
                            <Input
                              value={toDisplayClaimKey(field.value)}
                              onChange={(e) =>
                                field.onChange(toFullClaimKey(e.target.value))
                              }
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              list="rule-editor-claim-keys"
                              placeholder={
                                knownClaimShortNames[0] ?? "e.g. department"
                              }
                              className="w-full font-mono text-xs"
                            />
                            {knownClaimShortNames.length > 0 && (
                              <datalist id="rule-editor-claim-keys">
                                {knownClaimShortNames.map((k) => (
                                  <option key={k} value={k} />
                                ))}
                              </datalist>
                            )}
                          </>
                        )}
                      />
                    }
                  />

                  <FormField
                    field={{ label: "How it should match" }}
                    input={
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <Controller
                            control={control}
                            name="trigger.matcher.op"
                            render={({ field }) => (
                              <Segmented
                                groupId="matcher-op"
                                size="sm"
                                ariaLabel="Match operator"
                                value={field.value}
                                options={OPS.map((op) => ({
                                  value: op,
                                  label: MATCHER_OP_VERBS[op],
                                }))}
                                onChange={(v) => field.onChange(v)}
                              />
                            )}
                          />
                          <Controller
                            control={control}
                            name="trigger.matcher.caseInsensitive"
                            render={({ field }) => (
                              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <Toggle
                                  prefix="rule-ci"
                                  checked={!!field.value}
                                  onChange={field.onChange}
                                />
                                Ignore letter case
                              </label>
                            )}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {MATCHER_OP_HINTS[trigger.matcher.op]}
                        </p>
                      </div>
                    }
                  />

                  <FormField
                    field={{ label: "Values to match" }}
                    input={
                      <Controller
                        control={control}
                        name={"trigger.matcher.values" as never}
                        render={({ field }) => (
                          <div>
                            <ChipInput
                              value={(field.value as string[]) ?? []}
                              onChange={field.onChange}
                              placeholder="Type a value and press Enter…"
                              ariaLabel="Values to match"
                            />
                            {(
                              errors.trigger as
                                | {
                                    matcher?: { values?: { message?: string } };
                                  }
                                | undefined
                            )?.matcher?.values?.message && (
                              <p className="mt-1 text-xs text-red-700">
                                {
                                  (
                                    errors.trigger as {
                                      matcher?: {
                                        values?: { message?: string };
                                      };
                                    }
                                  ).matcher!.values!.message
                                }
                              </p>
                            )}
                          </div>
                        )}
                      />
                    }
                  />
                </div>
              </Collapsible>
            )}
          </AnimatePresence>
        </div>

        <Divider />

        {/* THEN */}
        <div className="space-y-4">
          <Segmented
            groupId="effect-kind"
            ariaLabel="What the rule does"
            value={effect.kind}
            options={[
              {
                value: "grant-role",
                label: EFFECT_KIND_LABELS["grant-role"],
                tint: "primary",
              },
              {
                value: "set-residence",
                label: EFFECT_KIND_LABELS["set-residence"],
                tint: "emerald",
              },
              {
                value: "join-audience",
                label: EFFECT_KIND_LABELS["join-audience"],
                tint: "secondary",
              },
            ]}
            onChange={(v) => {
              const kind = v as RuleEffect["kind"];
              if (kind === "grant-role")
                setValue("effect", {
                  kind: "grant-role",
                  roleSlug: "",
                  target: { kind: "org" },
                });
              else if (kind === "set-residence")
                setValue("effect", {
                  kind: "set-residence",
                  target: { kind: "fixed-unit", unitId: "" },
                });
              else
                setValue("effect", { kind: "join-audience", audienceId: "" });
            }}
          />

          <p className="text-xs text-gray-500">
            {EFFECT_KIND_DESCRIPTIONS[effect.kind]}
          </p>

          <motion.div
            layout
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={effect.kind}
                {...crossfade}
                className="space-y-4"
              >
                {effect.kind === "grant-role" && (
                  <GrantRoleFields
                    control={control}
                    setValue={setValue}
                    units={units}
                    roles={roles}
                    orgLabel={orgLabel}
                    effect={effect}
                  />
                )}
                {effect.kind === "set-residence" && (
                  <ResidenceFields control={control} units={units} />
                )}
                {effect.kind === "join-audience" && (
                  <FormField
                    field={{ label: "Training group" }}
                    input={
                      <Controller
                        control={control}
                        name="effect.audienceId"
                        render={({ field }) => (
                          <AudienceSelect
                            value={(field.value as string) ?? ""}
                            onChange={field.onChange}
                            activeAudiences={activeAudiences}
                            inactiveAudiences={inactiveAudiences}
                            showInactive={showInactiveAudiences}
                          />
                        )}
                      />
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {submitError && (
            <Collapsible key="submit-error">
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
                {submitError}
              </div>
            </Collapsible>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4 pt-1">
          <Controller
            control={control}
            name="disabled"
            render={({ field }) => (
              <label className="inline-flex items-center gap-3 text-sm text-gray-600">
                <Toggle
                  prefix="rule-disabled"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
                Save as disabled
              </label>
            )}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : initial
                  ? "Save changes"
                  : "Create rule"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Divider() {
  return <div className="border-t border-gray-200" />;
}

// -------- grant-role fields (scope first, then role) --------

function GrantRoleFields({
  control,
  setValue,
  units,
  roles,
  orgLabel,
  effect,
}: {
  control: ReturnType<typeof useForm<RuleFormValues>>["control"];
  setValue: ReturnType<typeof useForm<RuleFormValues>>["setValue"];
  units: Unit[];
  roles: AssignableRole[];
  orgLabel: string;
  effect: Extract<RuleFormValues["effect"], { kind: "grant-role" }>;
}) {
  const targetKind = effect.target.kind;
  const scopedRoles = roles.filter((r) => {
    if (r.slug === "system-admin") return false;
    if (targetKind === "org") return r.allowedScopes.includes("organization");
    return r.allowedScopes.includes("unit");
  });
  // Grant-role can target any unit in the tree: parents ("Performix ›
  // All Units") implicitly cover their subtree, leaves target themselves.
  const unitOptions = useMemo(() => buildUnitOptions(units), [units]);

  return (
    <>
      <FormField
        field={{
          label: "Where the role applies",
          helpText:
            "Some roles apply at the organization level; others only within a specific unit.",
        }}
        input={
          <Segmented
            groupId="grant-scope"
            size="sm"
            ariaLabel="Scope"
            value={targetKind}
            options={[
              { value: "org", label: `Across ${orgLabel}` },
              { value: "fixed-unit", label: "A specific unit" },
            ]}
            onChange={(v) => {
              if (v === "org")
                setValue("effect.target" as never, { kind: "org" } as never);
              else
                setValue(
                  "effect.target" as never,
                  {
                    kind: "fixed-unit",
                    unitId: "",
                  } as never,
                );
              setValue("effect.roleSlug", "");
            }}
          />
        }
      />

      {effect.target.kind === "fixed-unit" && (
        <FormField
          field={{ label: "Unit" }}
          input={
            <Controller
              control={control}
              name={"effect.target.unitId" as never}
              render={({ field }) => (
                <Select
                  value={(field.value as string) ?? ""}
                  onChange={(e) =>
                    field.onChange((e.target as HTMLSelectElement).value)
                  }
                  options={unitOptions.map((u) => ({
                    key: u.id,
                    label: u.label,
                  }))}
                />
              )}
            />
          }
        />
      )}

      <FormField
        field={{ label: "Role" }}
        input={
          <Controller
            control={control}
            name="effect.roleSlug"
            render={({ field }) => (
              <Select
                value={(field.value as string) ?? ""}
                onChange={(e) =>
                  field.onChange((e.target as HTMLSelectElement).value)
                }
                options={scopedRoles.map((r) => ({
                  key: r.slug,
                  label: r.name,
                }))}
              />
            )}
          />
        }
      />
    </>
  );
}

function ResidenceFields({
  control,
  units,
}: {
  control: ReturnType<typeof useForm<RuleFormValues>>["control"];
  units: Unit[];
}) {
  // Residency is a concrete home — a parent with sub-units isn't a place
  // a user can live, so leaf units only.
  const unitOptions = useMemo(
    () => buildUnitOptions(units, { leafOnly: true }),
    [units],
  );
  return (
    <FormField
      field={{ label: "Unit" }}
      input={
        <Controller
          control={control}
          name={"effect.target.unitId" as never}
          render={({ field }) => (
            <Select
              value={(field.value as string) ?? ""}
              onChange={(e) =>
                field.onChange((e.target as HTMLSelectElement).value)
              }
              options={unitOptions.map((u) => ({
                key: u.id,
                label: u.label,
              }))}
            />
          )}
        />
      }
    />
  );
}
