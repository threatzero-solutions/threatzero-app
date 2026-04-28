import { PlusIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "motion/react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Collapsible, CollapsibleItem } from "./Collapsible";
import { ConfirmationContext } from "../../contexts/core/confirmation-context";
import { useMe } from "../../contexts/me/MeProvider";
import { OrganizationsContext } from "../../contexts/organizations/organizations-context";
import {
  assignableRolesKey,
  AssignableRole,
  getAssignableRoles,
} from "../../queries/grants";
import {
  createRule,
  CreateRuleInput,
  deleteRule,
  getRules,
  Rule,
  rulesKey,
  updateRule,
} from "../../queries/rules";
import { getTrainingAudiences } from "../../queries/training";
import { Audience } from "../../types/entities";
import { RuleEditor } from "./RuleEditor";
import { RuleSentence } from "./RuleSentence";

const ALL_AUDIENCES_KEY = ["audiences", "all-slugs"] as const;

export function AccessRulesPanel() {
  const { currentOrganization, allUnits, organizationIdps } =
    useContext(OrganizationsContext);
  const { can, isGlobalAdmin } = useMe();
  const queryClient = useQueryClient();
  const { setOpen: setConfirmOpen, setClose: setConfirmClose } =
    useContext(ConfirmationContext);

  const orgId = currentOrganization?.id ?? "";
  const canManage = can("manage-org-rules");

  const [draft, setDraft] = useState<"new" | string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefillClaimKey, setPrefillClaimKey] = useState<string | null>(null);

  // Deep-link from the IDP forwarded-claim picker:
  //   /organizations/:id/settings?section=access-rules&new=1&claimKey=tz.idp.x
  // Opens the editor in "new" mode and pre-fills the claim-match trigger.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setSubmitError(null);
    setDraft("new");
    setPrefillClaimKey(searchParams.get("claimKey"));
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    next.delete("claimKey");
    setSearchParams(next, { replace: true });
    // Only fire on the first render that sees the flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Claim keys the org's IDPs are configured to forward — used to
  // populate the RuleEditor's datalist autocomplete. Union across all
  // IDPs, sorted, deduped.
  const knownClaimKeys = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const idp of organizationIdps ?? []) {
      for (const fc of idp?.forwardedClaims ?? []) set.add(fc.claimKey);
    }
    return [...set].sort();
  }, [organizationIdps]);

  const { data: rules, isLoading } = useQuery({
    queryKey: rulesKey(orgId),
    queryFn: () => getRules(orgId),
    enabled: !!orgId && canManage,
  });

  const { data: roles } = useQuery({
    queryKey: assignableRolesKey(orgId),
    queryFn: () => getAssignableRoles(orgId),
    enabled: !!orgId && canManage,
  });

  const activeAudiences = useMemo<Audience[]>(() => {
    const enrollments = currentOrganization?.enrollments ?? [];
    const byId = new Map<string, Audience>();
    for (const e of enrollments) {
      for (const a of e.course?.audiences ?? []) byId.set(a.id, a);
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    );
  }, [currentOrganization]);

  const { data: allAudiences } = useQuery({
    queryKey: ALL_AUDIENCES_KEY,
    queryFn: () => getTrainingAudiences({ limit: 500 }),
    enabled: canManage && isGlobalAdmin,
  });

  const inactiveAudiences = useMemo<Audience[]>(() => {
    if (!isGlobalAdmin || !allAudiences) return [];
    const activeIds = new Set(activeAudiences.map((a) => a.id));
    return allAudiences.results
      .filter((a) => !activeIds.has(a.id))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [isGlobalAdmin, allAudiences, activeAudiences]);

  const allAudiencesFlat = useMemo<Audience[]>(
    () => [...activeAudiences, ...inactiveAudiences],
    [activeAudiences, inactiveAudiences],
  );

  const units = allUnits ?? [];
  const orgLabel = currentOrganization?.name ?? "this organization";
  // Claim-based matching only makes sense when the org has at least one
  // identity provider wired up — no IDP means no claims to match on, so
  // we hide the SSO-specific UI and copy in that case.
  const hasIdp = (currentOrganization?.idpSlugs?.length ?? 0) > 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: rulesKey(orgId) });

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: (payload: CreateRuleInput) => createRule(orgId, payload),
    onSuccess: () => {
      invalidate();
      setDraft(null);
      setSubmitError(null);
    },
    onError: (err: AxiosError<{ message?: string | string[] }>) =>
      setSubmitError(extractMessage(err)),
  });

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateRuleInput }) =>
      updateRule(orgId, id, payload),
    onSuccess: () => {
      invalidate();
      setDraft(null);
      setSubmitError(null);
    },
    onError: (err: AxiosError<{ message?: string | string[] }>) =>
      setSubmitError(extractMessage(err)),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteRule(orgId, id),
    onSuccess: () => {
      invalidate();
      setConfirmClose();
    },
  });

  const { mutate: doToggleDisabled } = useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) =>
      updateRule(orgId, id, { disabled }),
    onSuccess: () => invalidate(),
  });

  const editing = useMemo(() => {
    if (!draft || draft === "new") return undefined;
    return rules?.find((r) => r.id === draft);
  }, [draft, rules]);

  const startNew = () => {
    setSubmitError(null);
    setDraft("new");
  };

  if (!canManage) return null;

  const hasRules = !!rules && rules.length > 0;

  return (
    <section className="space-y-6">
      <header className="max-w-[62ch]">
        <h2 className="text-base font-semibold text-gray-900">Access rules</h2>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          {hasIdp
            ? "Decide what role, home unit, or training group a user gets the moment they sign in — based on claims from your identity provider."
            : "Decide what role, home unit, or training group every new user gets automatically when they sign in."}
        </p>
      </header>

      <AnimatePresence initial={false}>
        {draft === "new" && (
          <Collapsible key="new-wrap">
            <RuleEditor
              hasIdp={hasIdp}
              knownClaimKeys={knownClaimKeys}
              initial={
                prefillClaimKey
                  ? ({
                      id: "",
                      trigger: {
                        kind: "claim-match",
                        claimKey: prefillClaimKey,
                        matcher: {
                          op: "equals",
                          values: [],
                          caseInsensitive: true,
                        },
                      },
                      effect: {
                        kind: "grant-role",
                        roleSlug: "",
                        target: { kind: "org" },
                      },
                      disabled: false,
                    } as unknown as Rule)
                  : undefined
              }
              units={units}
              roles={roles ?? []}
              activeAudiences={activeAudiences}
              inactiveAudiences={inactiveAudiences}
              showInactiveAudiences={isGlobalAdmin}
              orgLabel={orgLabel}
              onCancel={() => {
                setDraft(null);
                setSubmitError(null);
                setPrefillClaimKey(null);
              }}
              onSubmit={(p) => doCreate(p)}
              submitting={creating}
              submitError={submitError}
            />
          </Collapsible>
        )}
      </AnimatePresence>

      {isLoading && <ListSkeleton />}

      {!isLoading && !hasRules && draft !== "new" && (
        <EmptyState onCreate={startNew} hasIdp={hasIdp} />
      )}

      {!isLoading && hasRules && (
        <div className="rounded-lg bg-white ring-1 ring-gray-900/5 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            <AnimatePresence initial={false}>
              {rules!.map((rule) => {
                const isEditing = editing?.id === rule.id;
                return (
                  <CollapsibleItem key={rule.id}>
                    <motion.div
                      layout
                      transition={{
                        duration: 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={isEditing ? "p-3" : "px-5 py-4"}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {isEditing ? (
                          <motion.div
                            key="editor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.14 }}
                          >
                            <RuleEditor
                              hasIdp={hasIdp}
                              knownClaimKeys={knownClaimKeys}
                              chrome="nested"
                              initial={rule}
                              units={units}
                              roles={roles ?? []}
                              activeAudiences={activeAudiences}
                              inactiveAudiences={inactiveAudiences}
                              showInactiveAudiences={isGlobalAdmin}
                              orgLabel={orgLabel}
                              onCancel={() => {
                                setDraft(null);
                                setSubmitError(null);
                              }}
                              onSubmit={(p) =>
                                doUpdate({ id: rule.id, payload: p })
                              }
                              submitting={updating}
                              submitError={submitError}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.14 }}
                          >
                            <RuleRow
                              rule={rule}
                              units={units}
                              roles={roles ?? []}
                              audiences={allAudiencesFlat}
                              orgLabel={orgLabel}
                              onEdit={() => {
                                setSubmitError(null);
                                setDraft(rule.id);
                              }}
                              onToggle={() =>
                                doToggleDisabled({
                                  id: rule.id,
                                  disabled: !rule.disabled,
                                })
                              }
                              onDelete={() =>
                                setConfirmOpen({
                                  title: "Delete this rule?",
                                  message:
                                    "Users who only had access through this rule will lose it on their next sign-in.",
                                  confirmText: "Delete rule",
                                  destructive: true,
                                  onConfirm: () => doDelete(rule.id),
                                })
                              }
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </CollapsibleItem>
                );
              })}
            </AnimatePresence>
          </ul>

          {draft !== "new" && (
            <button
              type="button"
              onClick={startNew}
              className="group flex w-full items-center gap-2 border-t border-gray-200 px-5 py-3 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-b-lg transition-colors"
            >
              <PlusIcon className="size-4 text-gray-400 group-hover:text-gray-700" />
              Add another rule
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function RuleRow({
  rule,
  units,
  roles,
  audiences,
  orgLabel,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: Rule;
  units: Parameters<typeof RuleSentence>[0]["units"];
  roles: AssignableRole[];
  audiences: Audience[];
  orgLabel: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <RuleSentence
          rule={rule}
          units={units}
          roles={roles}
          audiences={audiences}
          orgLabel={orgLabel}
          disabled={rule.disabled}
        />
      </div>
      <div className="flex shrink-0 items-center gap-0.5 text-sm">
        <RowAction onClick={onToggle}>
          {rule.disabled ? "Enable" : "Disable"}
        </RowAction>
        <Sep />
        <RowAction onClick={onEdit}>Edit</RowAction>
        <Sep />
        <RowAction onClick={onDelete} danger>
          Delete
        </RowAction>
      </div>
    </div>
  );
}

function RowAction({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded px-2 py-1 text-xs font-medium transition-colors " +
        (danger
          ? "text-gray-500 hover:text-red-700"
          : "text-gray-500 hover:text-gray-900")
      }
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="text-gray-200">·</span>;
}

function EmptyState({
  onCreate,
  hasIdp,
}: {
  onCreate: () => void;
  hasIdp: boolean;
}) {
  return (
    <div className="rounded-lg bg-white ring-1 ring-gray-900/5 p-6">
      <h3 className="text-base font-semibold text-gray-900">No rules yet.</h3>
      <p className="mt-1 max-w-[58ch] text-sm text-gray-600 leading-relaxed">
        A rule says <span className="font-medium text-gray-800">when</span> it
        should run and <span className="font-medium text-gray-800">then</span>{" "}
        what it should do — grant a role, set a home unit, or add a user to a
        training group.
      </p>
      <div className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed">
        <span className="font-semibold uppercase tracking-wider text-[0.6875rem] text-primary-700 mr-2">
          Example
        </span>
        {hasIdp ? (
          <>
            When the <Mono>department</Mono> claim <Emph>starts with</Emph>{" "}
            <Mono>sec-</Mono>, <Emph>grant</Emph>{" "}
            <Mono>Training Coordinator</Mono> across this organization.
          </>
        ) : (
          <>
            For every new user, <Emph>grant</Emph>{" "}
            <Mono>Training Coordinator</Mono> across this organization.
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        Create your first rule
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse h-5 rounded bg-gray-100"
          style={{ width: `${92 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white px-1 py-0.5 text-[0.85em] text-gray-800">
      {children}
    </span>
  );
}
function Emph({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold uppercase tracking-wider text-[0.75em] text-primary-700">
      {children}
    </span>
  );
}

function extractMessage(
  err: AxiosError<{ message?: string | string[] }>,
): string {
  const m = err.response?.data?.message;
  if (Array.isArray(m)) return m.join(" ");
  if (typeof m === "string") return m;
  return err.message || "Something went wrong saving that rule.";
}
