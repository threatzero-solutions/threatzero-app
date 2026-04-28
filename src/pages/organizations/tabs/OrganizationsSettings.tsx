import { TrashIcon } from "@heroicons/react/20/solid";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useContext, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { AccessRulesPanel } from "../../../auth/rules/AccessRulesPanel";
import FormField from "../../../components/forms/FormField";
import Toggle from "../../../components/forms/inputs/Toggle";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import { useMe } from "../../../contexts/me/MeProvider";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  deleteOrganization,
  deleteUnit,
  saveOrganization,
} from "../../../queries/organizations";
import { classNames } from "../../../utils/core";
import { OrgScopeNotice } from "../components/OrgScopeNotice";
import { GeneralSection } from "./settings/GeneralSection";
import { SsoSection } from "./settings/SsoSection";

type SectionKey =
  | "general"
  | "access-rules"
  | "sso"
  | "notifications"
  | "advanced";

const MyOrganizationSettings: React.FC = () => {
  const {
    currentOrganization,
    currentOrganizationLoading,
    invalidateOrganizationQuery,
    invalidateAllUnitsQuery,
    currentUnit,
    isUnitContext,
    allUnits,
    navigateAfterDelete,
  } = useContext(OrganizationsContext);
  useAuth();
  const { canAny, me } = useMe();
  const {
    setOpen: setConfirmationOpen,
    setClose: setConfirmationClose,
    setConfirmationOptions,
  } = useContext(ConfirmationContext);

  const { mutate: doSaveOrganization, isPending: isOrganizationSaving } =
    useMutation({
      mutationFn: saveOrganization,
      onSuccess: () => invalidateOrganizationQuery(),
    });

  const { mutate: doDeleteOrganization, isPending: isOrganizationDeleting } =
    useMutation({
      mutationFn: deleteOrganization,
      onSuccess: () => {
        setConfirmationClose();
        navigateAfterDelete();
      },
    });

  const { mutate: doDeleteCurrentUnit, isPending: isUnitDeleting } =
    useMutation({
      mutationFn: deleteUnit,
      onSuccess: () => {
        invalidateAllUnitsQuery();
        setConfirmationClose();
        navigateAfterDelete();
      },
    });

  const deleteDisabled = useMemo(() => {
    // Pick the residence row for the org we're acting in. With the
    // residences[] shape there can be multiple, but only the one matching
    // the current org gates the delete.
    const residence = me?.residences?.find(
      (r) => r.organizationId === currentOrganization?.id,
    );
    if (!residence) return false;

    if (isUnitContext) {
      const residenceUnitId = residence.unitId;
      if (!residenceUnitId || !currentUnit?.id) return false;

      const unitsById = new Map((allUnits ?? []).map((u) => [u.id, u]));
      const visited = new Set<string>();
      let cursor: string | null = residenceUnitId;
      while (cursor && !visited.has(cursor)) {
        visited.add(cursor);
        if (cursor === currentUnit.id) return true;
        cursor = unitsById.get(cursor)?.parentUnitId ?? null;
      }
      return false;
    }

    return true;
  }, [isUnitContext, me, currentOrganization, currentUnit, allUnits]);

  const deleteTitle = useMemo(
    () =>
      `Delete ${
        isUnitContext
          ? (currentUnit?.name ?? "Unit")
          : (currentOrganization?.name ?? "Organization")
      }`,
    [isUnitContext, currentUnit, currentOrganization],
  );

  useEffect(() => {
    setConfirmationOptions((draft) => {
      draft.isPending = isUnitDeleting || isOrganizationDeleting;
    });
  }, [isUnitDeleting, isOrganizationDeleting, setConfirmationOptions]);

  const handleDelete = () => {
    setConfirmationOpen({
      title: deleteTitle + "?",
      message: `Are you sure you want to delete this ${
        isUnitContext ? "unit" : "organization"
      }? This action cannot be undone.`,
      onConfirm: () => {
        if (isUnitContext) {
          doDeleteCurrentUnit(currentUnit?.id);
        } else {
          doDeleteOrganization(currentOrganization?.id);
        }
      },
      destructive: true,
      confirmText: "Delete",
      requireTextInput: true,
      textInputPrompt: `Type ${
        isUnitContext ? "unit" : "organization"
      } name to confirm:`,
      textInputPlaceholder: isUnitContext
        ? currentUnit?.name
        : currentOrganization?.name,
      validateTextInput: (text) =>
        text ===
        (isUnitContext ? currentUnit?.name : currentOrganization?.name),
    });
  };

  const canManageRules = canAny("manage-org-rules");
  const canManageUnits = canAny("manage-units");
  const canManageOrganizations = canAny("manage-organizations");
  // `manage-idps` is a strict superset of `view-idps`; anyone who can write
  // the IDP config can read it. The view cap alone is rare (read-only roles).
  const canViewIdps = canAny("view-idps") || canAny("manage-idps");

  // The General/Notifications/Advanced sections mutate the current subject
  // (org or unit). Gate on the capability that matches the active scope —
  // otherwise a unit admin at org scope sees editable fields that 403 on
  // save.
  const canEditSubject = isUnitContext
    ? canManageUnits
    : canManageOrganizations;

  const availableSections = useMemo<
    { key: SectionKey; label: string }[]
  >(() => {
    const out: { key: SectionKey; label: string }[] = [];
    if (canEditSubject) out.push({ key: "general", label: "General" });
    if (canManageRules)
      out.push({ key: "access-rules", label: "Access rules" });
    if (canViewIdps) out.push({ key: "sso", label: "Single sign-on" });
    if (canEditSubject)
      out.push({ key: "notifications", label: "Notifications" });
    if (canEditSubject) out.push({ key: "advanced", label: "Advanced" });
    return out;
  }, [canManageRules, canEditSubject, canViewIdps]);

  const [searchParams, setSearchParams] = useSearchParams();
  const paramSection = searchParams.get("section") as SectionKey | null;
  const firstSection = availableSections[0]?.key;
  const activeSection: SectionKey | undefined =
    paramSection && availableSections.some((s) => s.key === paramSection)
      ? paramSection
      : firstSection;

  const switchSection = (key: SectionKey) => {
    const next = new URLSearchParams(searchParams);
    if (key === firstSection) next.delete("section");
    else next.set("section", key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      {currentOrganizationLoading || !currentOrganization ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
          <div className="animate-pulse rounded-sm bg-slate-200 w-full h-96" />
        </div>
      ) : (
        <div className="space-y-6">
          <nav
            aria-label="Settings sections"
            className="relative flex items-center gap-6 border-b border-gray-200 overflow-x-auto"
          >
            {availableSections.map((s) => {
              const active = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => switchSection(s.key)}
                  className={classNames(
                    "relative whitespace-nowrap py-3 text-sm font-medium transition-colors",
                    active
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-800",
                  )}
                >
                  {s.label}
                  {active && (
                    <motion.span
                      layoutId="settings-tab-underline"
                      className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary-400"
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeSection === "general" && <GeneralSection />}

              {activeSection === "access-rules" &&
                (isUnitContext ? (
                  <OrgScopeNotice
                    description={({ orgName, unitName }) => (
                      <>
                        Access rules cascade down from {orgName} to every unit,
                        so they're edited one level up. {unitName} inherits the
                        same rules as a read-only set.
                      </>
                    )}
                  />
                ) : (
                  <AccessRulesPanel />
                ))}

              {activeSection === "sso" && <SsoSection />}

              {activeSection === "notifications" &&
                (isUnitContext ? (
                  <OrgScopeNotice
                    description={({ orgName, unitName }) => (
                      <>
                        Notification preferences are set at the {orgName} level
                        and apply to every unit. {unitName} sends the same
                        emails {orgName} does.
                      </>
                    )}
                  />
                ) : (
                  <div className="space-y-5">
                    <div className="max-w-[62ch]">
                      <h2 className="text-base font-semibold text-gray-900">
                        Notifications
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Control the emails this organization sends to its users.
                      </p>
                    </div>

                    <FormField
                      field={{
                        label: "Initial training reminder emails",
                        helpText:
                          "Sent to all participants at the beginning of the training availability period.",
                      }}
                      input={
                        <Toggle
                          prefix="initial-training-reminder-emails"
                          loading={isOrganizationSaving}
                          disabled={isOrganizationSaving}
                          checked={
                            currentOrganization.notificationSettings
                              ?.initialReminderEmailsEnabled ?? false
                          }
                          onChange={(initialReminderEmailsEnabled) =>
                            doSaveOrganization({
                              id: currentOrganization.id,
                              notificationSettings: {
                                ...(currentOrganization.notificationSettings ??
                                  {}),
                                initialReminderEmailsEnabled,
                              },
                            })
                          }
                        />
                      }
                    />
                    <FormField
                      field={{
                        label: "Follow-up training reminder emails",
                        helpText:
                          "Sent up to two weeks after the initial reminder for any participant who hasn’t finished.",
                      }}
                      input={
                        <Toggle
                          prefix="follow-up-training-reminder-emails"
                          loading={isOrganizationSaving}
                          disabled={isOrganizationSaving}
                          checked={
                            currentOrganization.notificationSettings
                              ?.followUpReminderEmailsEnabled ?? false
                          }
                          onChange={(followUpReminderEmailsEnabled) =>
                            doSaveOrganization({
                              id: currentOrganization.id,
                              notificationSettings: {
                                ...(currentOrganization.notificationSettings ??
                                  {}),
                                followUpReminderEmailsEnabled,
                              },
                            })
                          }
                        />
                      }
                    />
                  </div>
                ))}

              {activeSection === "advanced" && (
                <div className="space-y-6">
                  <div className="max-w-[62ch]">
                    <h2 className="text-base font-semibold text-gray-900">
                      Advanced
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Settings that change how this{" "}
                      {isUnitContext ? "unit" : "organization"} behaves —
                      including actions that can't be undone.
                    </p>
                  </div>
                  {/*
                    Danger Zone — deliberately quiet. The chrome here is
                    a subtle terracotta surface, not a fire-alarm panel.
                    The destructive button is a ghost (white card with a
                    danger-tinted ring) so it reads as deliberate, not
                    urgent. The full-bleed red moment is reserved for
                    the confirmation modal, where the user has already
                    typed the org name — that's where alarm makes sense.
                  */}
                  <section className="rounded-lg bg-white ring-1 ring-danger-200/70">
                    <header className="flex items-start gap-3 border-b border-danger-100 px-5 py-4">
                      <TrashIcon
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-danger-500"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-danger-700">
                          Danger zone
                        </h3>
                        <p className="mt-0.5 max-w-prose text-sm text-gray-600">
                          Actions here are permanent. Make sure you've exported
                          anything you need first.
                        </p>
                      </div>
                    </header>
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          Delete this {isUnitContext ? "unit" : "organization"}
                        </div>
                        <p className="mt-0.5 max-w-prose text-xs text-gray-500">
                          {isUnitContext
                            ? "Removes the unit and everything inside it (sub-units, members, training stats). Members reassign manually."
                            : "Removes the organization and every unit, member, training record, and report attached to it."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete()}
                        disabled={deleteDisabled}
                        title={
                          deleteDisabled
                            ? `You can't delete a ${
                                isUnitContext ? "unit" : "organization"
                              } you belong to.`
                            : undefined
                        }
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-danger-700 shadow-xs ring-1 ring-inset ring-danger-200 transition-colors enabled:hover:bg-danger-50 enabled:hover:ring-danger-300 enabled:focus-visible:outline enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className="size-4" aria-hidden="true" />
                        Delete{" "}
                        {isUnitContext
                          ? (currentUnit?.name ?? "unit")
                          : (currentOrganization.name ?? "organization")}
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyOrganizationSettings;
