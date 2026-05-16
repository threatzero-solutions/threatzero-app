/**
 * Identity-providers card on the SSO settings tab.
 *
 * Shows the IDPs linked to an organization with edit-and-unlink affordances,
 * plus an Add CTA that opens the IDP setup slide-over. The "Link existing
 * IDP" path (paste an alias from the auth backend) is system-admin-only —
 * customers shouldn't see auth-backend internals on a tenant settings page.
 *
 * Visual chrome matches the Access tab pattern: a single `rounded-lg
 * bg-white p-4 ring-1 ring-gray-900/5` card with a top toolbar (primary
 * CTA on the right) and a quiet list below. Each IDP row is fully
 * clickable; secondary actions live behind a kebab dropdown.
 */
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  LinkIcon,
  MinusCircleIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useContext, useMemo, useState } from "react";
import Dropdown from "../../../components/layouts/Dropdown";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { LEVEL } from "../../../constants/permissions";
import { useAuth } from "../../../contexts/auth/useAuth";
import { ConfirmationContext } from "../../../contexts/core/confirmation-context";
import {
  getOrganizationIdp,
  saveOrganization,
} from "../../../queries/organizations";
import { OrganizationIdpDto } from "../../../types/api";
import { Organization } from "../../../types/entities";
import { cn } from "../../../utils/core";
import EditOrganizationIdp from "./EditOrganizationIdp";

interface OrganizationIdpsInputProps {
  organization: Organization;
  idpSlugs: string[];
  idps?: (OrganizationIdpDto | null)[];
}

const IdpRow: React.FC<{
  organizationId: Organization["id"];
  idpSlug: string;
  onSelect?: (idp: OrganizationIdpDto) => void;
  onUnlink?: (idpSlug: string) => void;
  idp?: OrganizationIdpDto | null;
}> = ({ organizationId, idpSlug, onSelect, onUnlink, idp: idpProp }) => {
  const { hasPermissions } = useAuth();
  const hasAdminLevel = hasPermissions([LEVEL.ADMIN]);

  const { data: idpData, isLoading: idpLoading } = useQuery({
    queryKey: ["organization-idps", organizationId, idpSlug] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationIdp(queryKey[1], queryKey[2]).catch((e) => {
        if (e instanceof AxiosError && e.response?.status === 404) {
          return null;
        }
        throw e;
      }),
    enabled: !idpProp,
  });

  const idp = idpProp || idpData;

  if (idpLoading) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <div className="size-9 shrink-0 animate-pulse rounded-md bg-gray-100" />
        <div className="grow space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
        </div>
      </li>
    );
  }

  // The unlinked-but-known case: the org references a slug that doesn't
  // resolve to an IDP we can read. Show the slug and a quiet hint.
  if (!idp) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-900">
              {idpSlug}
            </div>
            <div className="truncate text-xs text-gray-500">
              Linked but not loaded — the provider may have been removed.
            </div>
          </div>
        </div>
        {hasAdminLevel && onUnlink && (
          <button
            type="button"
            onClick={() => onUnlink(idpSlug)}
            className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-danger-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            aria-label={`Unlink ${idpSlug}`}
          >
            <MinusCircleIcon className="size-5" />
          </button>
        )}
      </li>
    );
  }

  // Two siblings inside a flex row, NOT a button-wrapping-a-button.
  // The left side (icon + text) is the click target that opens the
  // editor; the kebab is its own button so clicking it doesn't bubble
  // up and trigger the row click. Hover + focus visuals span the whole
  // row via `group` so it still reads as a single clickable surface.
  return (
    <li className="group relative flex items-stretch hover:bg-gray-50 focus-within:bg-gray-50">
      <button
        type="button"
        onClick={() => onSelect?.(idp)}
        className="flex grow items-center gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
          <ShieldCheckIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {idp.name}
            </span>
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                "bg-gray-100 text-gray-600",
              )}
              title={`${idp.protocol === "saml" ? "SAML 2.0" : "OpenID Connect"} provider`}
            >
              {idp.protocol === "saml" ? "SAML" : "OIDC"}
            </span>
          </div>
          {idp.domains.length > 0 ? (
            <div className="mt-0.5 truncate text-xs text-gray-500">
              {idp.domains.join(" · ")}
            </div>
          ) : (
            <div className="mt-0.5 truncate text-xs italic text-gray-400">
              No email domains configured
            </div>
          )}
        </div>
      </button>
      {hasAdminLevel && (
        <div className="flex shrink-0 items-center pr-3">
          <Dropdown
            valueIcon={<EllipsisVerticalIcon className="size-4" />}
            actions={[
              {
                id: "edit",
                value: (
                  <span className="inline-flex items-center gap-1">
                    <PencilIcon className="size-4 inline" /> Edit configuration
                  </span>
                ),
                action: () => onSelect?.(idp),
              },
              {
                id: "unlink",
                value: (
                  <span className="inline-flex items-center gap-1 text-danger-600">
                    <MinusCircleIcon className="size-4 inline" /> Unlink
                  </span>
                ),
                action: () => onUnlink?.(idp.slug),
              },
            ]}
          />
        </div>
      )}
    </li>
  );
};

const EmptyState: React.FC<{
  canAdd: boolean;
  onAdd: () => void;
}> = ({ canAdd, onAdd }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
      <ShieldCheckIcon className="size-6" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-gray-900">
        No identity providers yet
      </h4>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Connect your team's existing single sign-on so people can sign in to
        ThreatZero with the account they already use at work.
      </p>
    </div>
    {canAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <PlusIcon className="size-4" />
        Add identity provider
      </button>
    )}
  </div>
);

const OrganizationIdpsInput: React.FC<OrganizationIdpsInputProps> = ({
  organization,
  idpSlugs,
  idps,
}) => {
  const [editIdpSliderOpen, setEditIdpSliderOpen] = useState(false);
  const [activeIdp, setActiveIdp] = useState<OrganizationIdpDto | undefined>();

  const { hasPermissions, isGlobalAdmin } = useAuth();
  const canManage = hasPermissions([LEVEL.ADMIN]);

  const { setOpen: setConfirmationOpen, setClose: setConfirmationClose } =
    useContext(ConfirmationContext);

  const [slugToLink, setSlugToLink] = useState<string>("");

  const handleCreateIdp = () => {
    setActiveIdp(undefined);
    setEditIdpSliderOpen(true);
  };

  const queryClient = useQueryClient();
  const saveOrganizationMutation = useMutation({
    mutationFn: saveOrganization,
  });

  const handleLinkIdp = (close: () => void) => {
    if (!slugToLink) return;
    saveOrganizationMutation.mutate(
      {
        id: organization.id,
        idpSlugs: [...(idpSlugs || []), slugToLink],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["organization", "id", organization.id],
          });
          close();
          setSlugToLink("");
        },
      },
    );
  };

  const handleUnlinkIdp = (idpSlug: string) => {
    setConfirmationOpen({
      title: `Unlink ${idpSlug}?`,
      message: `Members of ${organization.name} won't be able to sign in through this provider until it's re-linked.`,
      onConfirm: () => {
        saveOrganizationMutation.mutate(
          {
            id: organization.id,
            idpSlugs: idpSlugs.filter((slug) => slug !== idpSlug),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["organization", "id", organization.id],
              });
              setConfirmationClose();
            },
          },
        );
      },
      destructive: true,
      confirmText: "Unlink",
    });
  };

  const idpsMap = useMemo(
    () =>
      idps?.reduce((acc, idp) => {
        if (idp) acc.set(idp.slug, idp);
        return acc;
      }, new Map<string, OrganizationIdpDto>()),
    [idps],
  );

  const isEmpty = idpSlugs.length === 0;

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white ring-1 ring-gray-900/5">
        {!isEmpty && canManage && (
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              {idpSlugs.length}{" "}
              {idpSlugs.length === 1 ? "provider" : "providers"} linked
            </p>
            <div className="flex items-center gap-2">
              {isGlobalAdmin && (
                <Popover as={Fragment}>
                  {({ open, close }) => (
                    <>
                      <PopoverButton
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        <LinkIcon className="size-3.5" />
                        Link existing
                      </PopoverButton>
                      <AnimatePresence>
                        {open && (
                          <PopoverPanel
                            className="rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5 [--anchor-gap:8px]"
                            anchor="bottom end"
                            static
                            as={motion.div}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                          >
                            <div className="w-80 px-4 py-4">
                              <h3 className="text-sm font-semibold text-gray-900">
                                Link existing provider
                              </h3>
                              <p className="mt-1 text-xs text-gray-500">
                                Paste the alias of an identity provider that's
                                already configured in the auth system.
                                System-admin only.
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <input
                                  id="idp-alias"
                                  name="idp-alias"
                                  type="text"
                                  placeholder="provider-alias"
                                  value={slugToLink}
                                  onChange={(e) =>
                                    setSlugToLink(e.target.value)
                                  }
                                  onKeyUp={(e) =>
                                    e.key === "Enter" && handleLinkIdp(close)
                                  }
                                  className="block w-full rounded-md border-0 py-1.5 text-sm text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleLinkIdp(close)}
                                  disabled={!slugToLink}
                                  className="shrink-0 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                >
                                  Link
                                </button>
                              </div>
                            </div>
                          </PopoverPanel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Popover>
              )}
              <button
                type="button"
                onClick={handleCreateIdp}
                className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <PlusIcon className="size-3.5" />
                Add provider
              </button>
            </div>
          </div>
        )}

        {isEmpty ? (
          <EmptyState canAdd={canManage} onAdd={handleCreateIdp} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {idpSlugs.map((idpSlug) => (
              <IdpRow
                key={idpSlug}
                idpSlug={idpSlug}
                organizationId={organization.id}
                idp={idpsMap?.get(idpSlug)}
                onSelect={(idp) => {
                  setActiveIdp(idp);
                  setEditIdpSliderOpen(true);
                }}
                onUnlink={handleUnlinkIdp}
              />
            ))}
          </ul>
        )}
      </div>
      <SlideOver open={editIdpSliderOpen} setOpen={setEditIdpSliderOpen}>
        <EditOrganizationIdp
          organization={organization}
          idp={activeIdp}
          setOpen={setEditIdpSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default OrganizationIdpsInput;
