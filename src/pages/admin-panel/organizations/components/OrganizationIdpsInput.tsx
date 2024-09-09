import { Fragment, useState } from "react";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditOrganizationIdp from "./EditOrganizationIdp";
import { OrganizationIdpDto } from "../../../../types/api";
import { Organization } from "../../../../types/entities";
import { MinusCircleIcon, PencilIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationIdp,
  saveOrganization,
} from "../../../../queries/organizations";
import { classNames } from "../../../../utils/core";
import { useAuth } from "../../../../contexts/AuthProvider";
import { LEVEL } from "../../../../constants/permissions";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { AxiosError } from "axios";

interface OrganizationIdpsInputProps {
  organizationId: Organization["id"];
  idpSlugs: string[];
}

const IdpRow: React.FC<{
  organizationId: Organization["id"];
  idpSlug: string;
  onSelect?: (idp: OrganizationIdpDto) => void;
  onUnlink?: (idpSlug: string) => void;
}> = ({ organizationId, idpSlug, onSelect, onUnlink }) => {
  const { hasPermissions } = useAuth();
  const hasAdminLevel = hasPermissions([LEVEL.ADMIN]);

  const { data: idp, isLoading: idpLoading } = useQuery({
    queryKey: ["organization-idps", organizationId, idpSlug] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationIdp(queryKey[1], queryKey[2]).catch((e) => {
        if (e instanceof AxiosError && e.response?.status === 404) {
          return null;
        }
        throw e;
      }),
  });

  return (
    <div className="flex items-start rounded-md shadow-sm ring-1 ring-inset ring-gray-300 py-4 px-6">
      {idpLoading ? (
        <div className="animate-pulse bg-slate-200 h-4 w-24 rounded-full"></div>
      ) : idp ? (
        <div className="flex-col gap-1" title="Click to manage">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer text-gray-900 hover:text-gray-600 transition-colors text-sm font-medium leading-6"
            onClick={() => onSelect?.(idp)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="block">{idp.name}</span>
            <span
              className={classNames(
                "rounded font-bold text-white px-2 py-1 uppercase text-xs",
                idp.protocol === "saml" ? "bg-green-400" : "bg-secondary-400"
              )}
            >
              {idp.protocol}
            </span>
          </button>
          <ol className="ml-2 pl-4 flex flex-col gap-2 border-l-2 border-l-secondary-400">
            {idp.domains.map((domain) => (
              <li className="text-sm text-gray-500" key={domain}>
                {domain}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 text-gray-500 text-sm font-medium leading-6"
          title="This IDP cannot be found."
        >
          <PencilIcon className="h-4 w-4" />
          <span className="block">{idpSlug}</span>
        </div>
      )}
      <div className="grow"></div>
      {hasAdminLevel && (
        <button
          type="button"
          className="inline-flex items-center gap-1 cursor-pointer text-red-500 hover:text-red-700 transition-colors text-sm"
          onClick={() => onUnlink?.(idpSlug)}
        >
          <span>Unlink</span>
          <MinusCircleIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const OrganizationIdpsInput: React.FC<OrganizationIdpsInputProps> = ({
  organizationId,
  idpSlugs,
}) => {
  const [editIdpSliderOpen, setEditIdpSliderOpen] = useState(false);
  const [activeIdp, setActiveIdp] = useState<OrganizationIdpDto | undefined>();

  const { hasPermissions } = useAuth();
  const hasAdminLevel = hasPermissions([LEVEL.ADMIN]);

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
    if (!slugToLink) {
      return;
    }
    saveOrganizationMutation.mutate(
      {
        id: organizationId,
        idpSlugs: [...(idpSlugs || []), slugToLink],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["organizations", organizationId],
          });
          close();
          setSlugToLink("");
        },
      }
    );
  };

  const handleUnlinkIdp = (idpSlug: string) => {
    saveOrganizationMutation.mutate(
      {
        id: organizationId,
        idpSlugs: idpSlugs.filter((slug) => slug !== idpSlug),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["organizations", organizationId],
          });
        },
      }
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {idpSlugs.map((idpSlug) => (
          <IdpRow
            key={idpSlug}
            idpSlug={idpSlug}
            organizationId={organizationId}
            onSelect={(idp) => {
              setActiveIdp(idp);
              setEditIdpSliderOpen(true);
            }}
            onUnlink={handleUnlinkIdp}
          />
        ))}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleCreateIdp()}
            className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Add Identity Provider
          </button>
          {hasAdminLevel && (
            <Popover as={Fragment}>
              {({ open, close }) => (
                <>
                  <PopoverButton
                    type="button"
                    className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Link Existing IDP
                  </PopoverButton>
                  <AnimatePresence>
                    {open && (
                      <PopoverPanel
                        className="bg-white shadow sm:rounded-lg [--anchor-gap:8px]"
                        anchor="bottom end"
                        static
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Link External Identity Provider
                          </h3>
                          <div className="mt-2 max-w-md text-sm text-gray-500">
                            <p>
                              Enter the "alias" of the identity provider you
                              want to link. The alias can be found in the
                              identity provider settings in Keycloak.
                            </p>
                          </div>
                          <div className="mt-5 sm:flex sm:items-center w-full">
                            <div className="w-full">
                              <label htmlFor="idp-alias" className="sr-only">
                                IDP Alias
                              </label>
                              <input
                                id="idp-alias"
                                name="idp-alias"
                                type="text"
                                placeholder="your-idp-alias"
                                value={slugToLink}
                                onChange={(e) => setSlugToLink(e.target.value)}
                                onKeyUp={(e) =>
                                  e.key === "Enter" && handleLinkIdp(close)
                                }
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLinkIdp(close)}
                              className="mt-3 inline-flex w-full items-center justify-center rounded-md transition-colors bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 sm:ml-3 sm:mt-0 sm:w-auto"
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
        </div>
      </div>
      <SlideOver open={editIdpSliderOpen} setOpen={setEditIdpSliderOpen}>
        <EditOrganizationIdp
          organizationId={organizationId}
          idp={activeIdp}
          setOpen={setEditIdpSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default OrganizationIdpsInput;
