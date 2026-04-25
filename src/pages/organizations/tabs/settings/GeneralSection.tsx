import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import FormField from "../../../../components/forms/FormField";
import Input from "../../../../components/forms/inputs/Input";
import TextArea from "../../../../components/forms/inputs/TextArea";
import IconButton from "../../../../components/layouts/buttons/IconButton";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditOrganizationPolicyFile from "../../../../components/safety-management/EditOrganizationPolicyFile";
import { formatPhoneNumber } from "../../../../utils/core";
import { useAuth } from "../../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../../contexts/core/confirmation-context";
import { OrganizationsContext } from "../../../../contexts/organizations/organizations-context";
import {
  getGenerateOrganizationPolicyUploadUrlsUrl,
  getGenerateUnitPolicyUploadUrlsUrl,
  saveOrganization,
  saveUnit,
} from "../../../../queries/organizations";
import {
  FieldType,
  Organization,
  OrganizationLabelPreset,
  OrganizationPolicyFile,
  SafetyContact,
} from "../../../../types/entities";
import { OrganizationStatusBadge } from "../../components/OrganizationStatusBadge";

type PolicyDraft = Partial<OrganizationPolicyFile> & { id?: string };

const EMPTY_SAFETY: Partial<SafetyContact> = {
  name: "",
  email: "",
  phone: "",
  title: "",
};

export const GeneralSection: React.FC = () => {
  const { isGlobalAdmin } = useAuth();
  const {
    currentOrganization,
    currentUnit,
    invalidateOrganizationQuery,
    invalidateCurrentUnitQuery,
    isUnitContext,
  } = useContext(OrganizationsContext);

  const { setOpen: openConfirm, setClose: closeConfirm } =
    useContext(ConfirmationContext);

  const [editPolicyOpen, setEditPolicyOpen] = useState(false);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft | undefined>();

  const { mutate: saveOrganizationMutate, isPending: organizationIsSaving } =
    useMutation({
      mutationFn: saveOrganization,
      onSuccess: () => invalidateOrganizationQuery(),
    });

  const { mutate: saveCurrentUnit, isPending: unitIsSaving } = useMutation({
    mutationFn: saveUnit,
    onSuccess: () => invalidateCurrentUnitQuery(),
  });

  const handleSave = useCallback(
    (data: Partial<Organization>) => {
      if (isUnitContext) {
        if (currentUnit?.id) {
          saveCurrentUnit({ id: currentUnit.id, ...data });
        }
      } else if (currentOrganization?.id) {
        saveOrganizationMutate({ id: currentOrganization.id, ...data });
      }
    },
    [
      isUnitContext,
      currentUnit?.id,
      currentOrganization?.id,
      saveCurrentUnit,
      saveOrganizationMutate,
    ],
  );

  const subject = isUnitContext ? currentUnit : currentOrganization;

  // --- details: local mirror of name/address for blur-to-save ---
  const [name, setName] = useState(subject?.name ?? "");
  const [address, setAddress] = useState(subject?.address ?? "");
  useEffect(() => setName(subject?.name ?? ""), [subject?.name]);
  useEffect(() => setAddress(subject?.address ?? ""), [subject?.address]);

  // --- safety contact: local mirror, blur-to-save ---
  const initialSafety = useMemo<Partial<SafetyContact>>(
    () => ({ ...EMPTY_SAFETY, ...(subject?.safetyContact ?? {}) }),
    [subject?.safetyContact],
  );
  const [safety, setSafety] = useState(initialSafety);
  useEffect(() => setSafety(initialSafety), [initialSafety]);

  if (!currentOrganization) return null;

  const policies = subject?.policiesAndProcedures ?? [];
  const policyUploadUrl = isUnitContext
    ? getGenerateUnitPolicyUploadUrlsUrl(currentUnit?.id ?? "")
    : getGenerateOrganizationPolicyUploadUrlsUrl(currentOrganization.id);
  const isSaving = isUnitContext ? unitIsSaving : organizationIsSaving;

  const detailsDirty =
    name.trim() !== (subject?.name ?? "") ||
    address !== (subject?.address ?? "");
  const detailsValid = name.trim().length > 0;

  const saveDetails = () => {
    if (!detailsDirty || !detailsValid) return;
    handleSave({ name: name.trim(), address });
  };
  const resetDetails = () => {
    setName(subject?.name ?? "");
    setAddress(subject?.address ?? "");
  };

  const safetyKey = (v: Partial<SafetyContact>) =>
    JSON.stringify({
      name: (v.name ?? "").trim(),
      email: (v.email ?? "").trim(),
      phone: (v.phone ?? "").trim(),
      title: (v.title ?? "").trim(),
    });
  const safetyDirty = safetyKey(safety) !== safetyKey(initialSafety);
  const hasExistingSafety = !!subject?.safetyContact;
  const allSafetyEmpty =
    !safety.name?.trim() &&
    !safety.email?.trim() &&
    !safety.phone?.trim() &&
    !safety.title?.trim();
  const safetyComplete =
    !!safety.name?.trim() && !!safety.email?.trim() && !!safety.phone?.trim();
  // Saveable when either (a) all required fields are filled OR
  // (b) the user has cleared every field to remove an existing contact.
  const safetyValid = safetyComplete || (allSafetyEmpty && hasExistingSafety);

  const saveSafety = () => {
    if (!safetyDirty || !safetyValid) return;
    handleSave({
      safetyContact: (allSafetyEmpty ? null : safety) as SafetyContact | null,
    });
  };
  const resetSafety = () => setSafety(initialSafety);

  const handleRemovePolicy = (file: PolicyDraft) => {
    openConfirm({
      title: `Remove ${file.name ?? "file"}?`,
      message:
        "This document will no longer be visible to users. You can re-upload it later.",
      destructive: true,
      confirmText: "Remove",
      onConfirm: () => {
        handleSave({
          policiesAndProcedures: policies.filter(
            (p) => p.id !== file.id,
          ) as OrganizationPolicyFile[],
        });
        closeConfirm();
      },
    });
  };

  const handleSavePolicy = (file: PolicyDraft) => {
    const normalized: PolicyDraft = {
      ...file,
      id: file.id?.startsWith("TEMP-ID-") ? undefined : file.id,
    };
    const next = normalized.id
      ? policies.map((p) => (p.id === normalized.id ? normalized : p))
      : [...policies, normalized];
    handleSave({
      policiesAndProcedures: next as OrganizationPolicyFile[],
    });
    setEditPolicyOpen(false);
  };

  const openAddPolicy = () => {
    setPolicyDraft(undefined);
    setEditPolicyOpen(true);
  };
  const openEditPolicy = (file: PolicyDraft) => {
    setPolicyDraft(file);
    setEditPolicyOpen(true);
  };

  return (
    <div className="space-y-10">
      <Section
        heading="Details"
        description={`Basic identifiers for this ${isUnitContext ? "unit" : "organization"}.`}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            field={{ label: "Name", required: true }}
            input={
              <Input
                type={FieldType.TEXT}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            }
          />
          {isGlobalAdmin && !isUnitContext && currentOrganization.status && (
            <FormField
              field={{ label: "Status" }}
              input={
                <div className="py-1">
                  <OrganizationStatusBadge
                    status={currentOrganization.status}
                  />
                </div>
              }
              helpTextFirst
            />
          )}
          <div className="sm:col-span-2">
            <FormField
              field={{
                label: "Address",
                helpText: "Optional. Shown to users alongside safety info.",
              }}
              input={
                <TextArea
                  value={address ?? ""}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full"
                />
              }
            />
          </div>
        </div>
        <SectionFooter
          dirty={detailsDirty}
          canSave={detailsDirty && detailsValid}
          saving={isSaving}
          onSave={saveDetails}
          onDiscard={resetDetails}
        />
      </Section>

      <Section
        heading="Safety contact"
        description="The primary person users reach when something goes wrong. Shown anywhere safety guidance appears."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            field={{ label: "Name", required: true }}
            input={
              <Input
                type={FieldType.TEXT}
                value={safety.name ?? ""}
                onChange={(e) =>
                  setSafety((s) => ({ ...s, name: e.target.value }))
                }
                className="w-full"
                placeholder="Jane Smith"
              />
            }
          />
          <FormField
            field={{ label: "Title (optional)" }}
            input={
              <Input
                type={FieldType.TEXT}
                value={safety.title ?? ""}
                onChange={(e) =>
                  setSafety((s) => ({ ...s, title: e.target.value }))
                }
                className="w-full"
                placeholder="Director of Safety"
              />
            }
          />
          <FormField
            field={{ label: "Email", required: true }}
            input={
              <Input
                type={FieldType.EMAIL}
                value={safety.email ?? ""}
                onChange={(e) =>
                  setSafety((s) => ({ ...s, email: e.target.value }))
                }
                className="w-full"
                placeholder="safety@example.com"
              />
            }
          />
          <FormField
            field={{ label: "Phone", required: true }}
            input={
              <Input
                type={FieldType.TEL}
                value={safety.phone ?? ""}
                onChange={(e) =>
                  setSafety((s) => ({
                    ...s,
                    phone: formatPhoneNumber(e.target.value),
                  }))
                }
                className="w-full"
                placeholder="(555) 123-4567"
              />
            }
          />
        </div>
        <SectionFooter
          dirty={safetyDirty}
          canSave={safetyDirty && safetyValid}
          saving={isSaving}
          onSave={saveSafety}
          onDiscard={resetSafety}
          saveLabel={
            allSafetyEmpty && hasExistingSafety
              ? "Remove safety contact"
              : "Save"
          }
          destructive={allSafetyEmpty && hasExistingSafety}
          hint={
            safetyDirty && !safetyValid
              ? "Name, email, and phone are required."
              : undefined
          }
        />
      </Section>

      <Section
        heading="Policies & procedures"
        description="Documents users can reference at any time — handbooks, procedures, emergency plans."
        action={
          <IconButton
            icon={PlusIcon}
            text="Add document"
            type="button"
            onClick={openAddPolicy}
            className="bg-white ring-gray-300 text-gray-900 hover:bg-gray-50"
          />
        }
      >
        {policies.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {policies.map((p) => (
              <PolicyRow
                key={p.id}
                file={p}
                onEdit={() => openEditPolicy(p)}
                onRemove={() => handleRemovePolicy(p)}
              />
            ))}
          </ul>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-500"
          >
            No documents uploaded yet.
          </motion.p>
        )}
      </Section>

      {/* Only policies need a slide-over — file upload is complex enough to
          warrant the dedicated surface. Details + safety contact are fully
          inline above. */}
      <SlideOver open={editPolicyOpen} setOpen={setEditPolicyOpen}>
        <EditOrganizationPolicyFile
          generatePolicyUploadsUrlsUrl={policyUploadUrl}
          organizationPolicyFile={policyDraft}
          onSave={handleSavePolicy}
          setOpen={setEditPolicyOpen}
          saving={isSaving}
        />
      </SlideOver>

      {/* Silently surface save activity for field edits. */}
      <p aria-live="polite" className="sr-only">
        {isSaving ? "Saving…" : ""}
      </p>

      {/* admin: label preset lives here only for organization scope. Kept
          out of the main grid since it's rarely changed after setup. */}
      {isGlobalAdmin && !isUnitContext && (
        <LabelPresetControl
          value={
            (currentOrganization.labelPreset as OrganizationLabelPreset) ??
            OrganizationLabelPreset.DEFAULT
          }
          onChange={(labelPreset) => handleSave({ labelPreset })}
        />
      )}
    </div>
  );
};

// ---------- building blocks ----------

function Section({
  heading,
  description,
  action,
  children,
}: {
  heading: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>
          {description && (
            <p className="mt-1 max-w-[62ch] text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionFooter({
  dirty,
  canSave,
  saving,
  onSave,
  onDiscard,
  saveLabel = "Save",
  destructive,
  hint,
}: {
  dirty: boolean;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
  destructive?: boolean;
  hint?: string;
}) {
  if (!dirty) return null;
  return (
    <div className="mt-5 flex items-center justify-end gap-3">
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || saving}
        className={
          "rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 " +
          (destructive
            ? "bg-red-600 hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600"
            : "bg-primary-600 hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600")
        }
      >
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

function PolicyRow({
  file,
  onEdit,
  onRemove,
}: {
  file: PolicyDraft;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 min-w-0 text-left text-sm text-gray-900 hover:text-secondary-700 transition-colors truncate"
      >
        {file.name ?? file.pdfS3Key ?? "Untitled"}
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Remove</span>
        </button>
      </div>
    </li>
  );
}

// ---------- admin-only label preset ----------

const LABEL_PRESETS: { value: OrganizationLabelPreset; label: string }[] = [
  { value: OrganizationLabelPreset.DEFAULT, label: "Default (Unit / Units)" },
  { value: OrganizationLabelPreset.SCHOOL, label: "School / Schools" },
  { value: OrganizationLabelPreset.BUSINESS, label: "Site / Sites" },
];

function LabelPresetControl({
  value,
  onChange,
}: {
  value: OrganizationLabelPreset;
  onChange: (v: OrganizationLabelPreset) => void;
}) {
  return (
    <Section
      heading="Vocabulary"
      description="How this organization's sub-structure is labeled across the app."
    >
      <FormField
        field={{ label: "Substructure label" }}
        input={
          <select
            value={value}
            onChange={(e) =>
              onChange(e.target.value as OrganizationLabelPreset)
            }
            className="block w-full max-w-xs rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
          >
            {LABEL_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />
    </Section>
  );
}
