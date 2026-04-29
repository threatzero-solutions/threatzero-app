import { PlusIcon, TrashIcon, ArrowRightIcon } from "@heroicons/react/20/solid";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import {
  toDisplayClaimKey,
  toFullClaimKey,
} from "../../../auth/rules/claim-key";
import Input from "../../../components/forms/inputs/Input";
import type { OrganizationIdpDto } from "../../../types/api";

/**
 * Editor for `forwardedClaims`. Each row pairs an upstream claim name
 * with a short name the rule engine matches on. The short name is
 * stored as `tz.idp.<short>` on the wire — the prefix is applied
 * behind the scenes so admins never have to type it.
 *
 * The "Create access rule…" button hops to the Access tab with the
 * claim key pre-selected on the rule editor. The two surfaces are
 * decoupled at the data layer — this just deep-links so admins don't
 * have to copy the key by hand.
 */
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/^.*[/:#]/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "claim";

const ForwardedClaimsInput: React.FC = () => {
  const { control, setValue, getValues, watch } =
    useFormContext<OrganizationIdpDto>();
  const navigate = useNavigate();
  const { id: orgId } = useParams<{ id: string }>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "forwardedClaims",
  });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          No forwarded claims. Add one for each IDP claim an Access Rule needs
          to read (e.g. an AD group, OU path, or department). Profile sync
          (name, picture) is configured above under Profile Sync and doesn't
          need to be listed here.
        </p>
      )}

      {fields.map((field, index) => {
        const claimKey = watch(`forwardedClaims.${index}.claimKey` as const);

        return (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_1fr_auto] items-start gap-2 rounded-sm border border-gray-200 p-3"
          >
            <Controller
              control={control}
              name={`forwardedClaims.${index}.externalName` as const}
              rules={{ required: true }}
              render={({ field: externalField }) => (
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  IDP claim
                  <Input
                    value={externalField.value ?? ""}
                    onBlur={externalField.onBlur}
                    name={externalField.name}
                    ref={externalField.ref}
                    onChange={(e) => {
                      const nextExternal = e.target.value;
                      const priorExternal = externalField.value ?? "";
                      externalField.onChange(nextExternal);

                      // Auto-suggest the short name from the IDP claim
                      // only while the admin hasn't diverged from the
                      // prior suggestion. Compare against the slugified
                      // prior value so edits flow through cleanly.
                      const currentSuffix = toDisplayClaimKey(
                        getValues(`forwardedClaims.${index}.claimKey` as const),
                      );
                      const priorSuggested = slugify(priorExternal);
                      if (!currentSuffix || currentSuffix === priorSuggested) {
                        setValue(
                          `forwardedClaims.${index}.claimKey` as const,
                          toFullClaimKey(slugify(nextExternal)),
                          { shouldDirty: true, shouldValidate: true },
                        );
                      }
                    }}
                    className="w-full"
                    placeholder="e.g. department, http://…/claims/groups"
                  />
                </label>
              )}
            />

            <Controller
              control={control}
              name={`forwardedClaims.${index}.claimKey` as const}
              rules={{
                required: true,
                pattern: /^tz\.idp\.[a-z][a-z0-9_]*$/,
              }}
              render={({ field: keyField }) => (
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Short name
                  <Input
                    value={toDisplayClaimKey(keyField.value)}
                    onChange={(e) => {
                      keyField.onChange(toFullClaimKey(e.target.value));
                    }}
                    onBlur={keyField.onBlur}
                    name={keyField.name}
                    ref={keyField.ref}
                    className="w-full font-mono text-xs"
                    placeholder="department"
                  />
                </label>
              )}
            />

            <div className="flex items-center gap-1 pt-5">
              {orgId && claimKey && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/organizations/${orgId}/settings?section=access-rules&new=1&claimKey=${encodeURIComponent(claimKey)}`,
                    )
                  }
                  title="Create an access rule that matches this claim"
                  className="inline-flex items-center gap-1 rounded-sm border border-secondary-200 bg-secondary-50 px-2 py-1 text-xs text-secondary-700 hover:bg-secondary-100"
                >
                  Rule <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                title="Remove this claim"
                className="rounded-sm p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ externalName: "", claimKey: "" })}
        className="inline-flex items-center gap-1 self-start rounded-sm border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        <PlusIcon className="h-4 w-4" /> Add claim
      </button>
    </div>
  );
};

export default ForwardedClaimsInput;
