import MultilineTextInput from "../../../../components/forms/inputs/MultilineTextInput";
import MultipleSelect from "../../../../components/forms/inputs/MultipleSelect";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import { OrganizationIdpDto } from "../../../../types/api";
import { Organization } from "../../../../types/entities";
import { classNames } from "../../../../utils/core";
import IdpMetadataInput from "./IdpMetadataInput";
import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganizationIdp,
  deleteOrganizationIdp,
  getOrganizationIdpRoleGroups,
  updateOrganizationIdp,
} from "../../../../queries/organizations";
import Input from "../../../../components/forms/inputs/Input";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
} from "@heroicons/react/20/solid";
import { CoreContext } from "../../../../contexts/core/core-context";
import UnitMatchersInput from "./UnitMatchersInput";
import { Transition } from "@headlessui/react";
import AudienceMatchersInput from "./AudienceMatchersInput";
import RoleGroupMatchersInput from "./RoleGroupMatchersInput";
import Select from "../../../../components/forms/inputs/Select";
import SyncAttributesInput from "./SyncAttributesInput";
import { AlertContext } from "../../../../contexts/alert/alert-context";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useAutoSlug } from "../../../../hooks/use-auto-slug";

const SERVICE_PROVIDER_ENTITY_ID =
  "https://auth.threatzero.org/realms/threatzero";
const SERVICE_PROVIDER_REDIRECT_URL = (slug: string) =>
  `https://auth.threatzero.org/realms/threatzero/broker/${slug}/endpoint`;

const DISABLED_ROLE_GROUPS = ["ThreatZero Administrator"];

interface EditOrganizationIdpProps {
  organization: Organization;
  idp: OrganizationIdpDto | undefined;
  setOpen: (open: boolean) => void;
}

const INITIAL_IDP: OrganizationIdpDto = {
  name: "",
  slug: "",
  protocol: "saml",
  domains: [],
  unitMatchers: [],
  audienceMatchers: [],
  roleGroupMatchers: [],
  defaultRoleGroups: [],
  defaultAudience: undefined,
  importedConfig: {},
};

const IdpConfigValue: React.FC<{ value: string; label: string }> = ({
  value,
  label,
}) => {
  const { setSuccess } = useContext(AlertContext);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs">{label}</span>
      <div className="relative w-full">
        <div
          className={
            "cursor-pointer absolute inset-y-0 left-0 flex items-center pl-3 hover:opacity-75 transition-opacity"
          }
          onClick={() => {
            navigator.clipboard.writeText(value);
            setSuccess("Copied to clipboard", 5000);
          }}
        >
          <ClipboardIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
        <Input className="pl-10 w-full" readOnly={true} value={value} />
      </div>
    </div>
  );
};

const ATTRIBUTE_MATCHER_TYPES = ["Units", "Audiences", "Role Groups"];

const EditOrganizationIdp: React.FC<EditOrganizationIdpProps> = ({
  organization,
  idp: idpProp,
  setOpen,
}) => {
  const isNew = !idpProp;
  const originalSlug = idpProp?.slug;

  const formMethods = useForm({
    defaultValues: idpProp ?? INITIAL_IDP,
  });
  const { control, register, handleSubmit, watch } = formMethods;

  const name = watch("name");
  const slug = watch("slug");
  const protocol = watch("protocol");

  const { registerSlug, resetSlug } = useAutoSlug({
    ...formMethods,
    defaultSlug: idpProp?.slug,
  });

  const [showCopyableConfig, setShowCopyableConfig] = useState(isNew);

  const [selectedAttributeMatcherTab, setSelectedAttributeMatcherTab] =
    useState(ATTRIBUTE_MATCHER_TYPES[0]);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const { data: allowedRoleGroups } = useQuery({
    queryKey: ["roleGroups", organization.id] as const,
    queryFn: ({ queryKey }) => getOrganizationIdpRoleGroups(queryKey[1]),
  });

  const queryClient = useQueryClient();
  const createIdpMutation = useMutation({
    mutationFn: (idp: OrganizationIdpDto) =>
      isNew
        ? createOrganizationIdp(organization.id, idp)
        : updateOrganizationIdp(organization.id, originalSlug as string, idp),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-idps", organization.id, originalSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", "id", organization.id],
      });
      setOpen(false);
    },
  });

  const deleteIdpMutation = useMutation({
    mutationFn: () =>
      deleteOrganizationIdp(organization.id, originalSlug as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "id", organization.id],
      });
      setConfirmationClose();
      setOpen(false);
    },
  });

  const handleSave = (idp: Partial<OrganizationIdpDto>) => {
    createIdpMutation.mutate(idp as OrganizationIdpDto);
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${name} IDP`,
      message: `Are you sure you want to delete this identity provider?
      This may affect the ability of users in your organization to log in and
      access training and other tools. This action cannot be undone.`,
      onConfirm: () => {
        deleteIdpMutation.mutate();
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

  return (
    <FormProvider {...formMethods}>
      <SlideOverForm
        onSubmit={handleSubmit(handleSave)}
        onClose={() => setOpen(false)}
        onDelete={handleDelete}
        hideDelete={isNew}
        submitText={isNew ? "Add" : "Update"}
        isSaving={createIdpMutation.isPending}
      >
        <SlideOverHeading
          title={!isNew ? "Edit Identity Provider" : "Add Identity Provider"}
          description={`Copy configuration values below to paste into your ${protocol.toUpperCase()} provider.`}
          setOpen={setOpen}
        >
          <div className="flex flex-col pt-2 text-gray-500">
            <button
              type="button"
              onClick={() => setShowCopyableConfig((v) => !v)}
              className="text-start text-sm text-secondary-600 hover:text-secondary-700 transition-colors inline-flex items-center gap-1"
            >
              <span>
                {showCopyableConfig
                  ? "Hide configuration values"
                  : "Show configuration values"}
              </span>
              {showCopyableConfig ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
            <Transition show={showCopyableConfig}>
              <div
                className={classNames(
                  "flex flex-col gap-3 transition-all duration-500 ease-in-out max-h-32 overflow-hidden mt-3",
                  "data-[closed]:max-h-0 data-[closed]:mt-0 data-[closed]:opacity-0"
                )}
              >
                <IdpConfigValue
                  value={slug ? SERVICE_PROVIDER_REDIRECT_URL(slug) : ""}
                  label={`Redirect${protocol === "saml" ? " / ACS" : ""} URL`}
                />
                {protocol === "saml" && (
                  <IdpConfigValue
                    label="Entity ID"
                    value={SERVICE_PROVIDER_ENTITY_ID}
                  />
                )}
              </div>
            </Transition>
          </div>
        </SlideOverHeading>
        <SlideOverFormBody>
          <SlideOverField
            label="Name"
            helpText="Name of the identity provider."
          >
            <Input
              {...register("name")}
              type="text"
              required
              className="w-full"
            />
          </SlideOverField>
          <SlideOverField
            label="Slug"
            helpText="<strong>This field will automatically populate from the name.</strong> Similar to the name, the slug is used in the redirect URL and must be URL safe."
          >
            <div className="relative">
              <Input
                type="text"
                required
                {...registerSlug()}
                className="w-full pr-7"
              />
              <button
                type="button"
                className="group absolute right-2 top-1/2 -translate-y-1/2 disabled:opacity-50"
                title="Generate slug from name"
                onClick={() => resetSlug()}
                disabled={!name}
              >
                <ArrowPathIcon className="size-4 group-hover:group-enabled:rotate-180 duration-500 transition-transform" />
              </button>
            </div>
          </SlideOverField>
          <SlideOverField
            label="Protocol"
            helpText="The protocol of the identity provider, either SAML or OIDC."
          >
            <Controller
              name="protocol"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={[
                    {
                      key: "saml",
                      label: "SAML 2.0",
                    },
                    {
                      key: "oidc",
                      label: "OpenID Connect",
                    },
                  ]}
                />
              )}
            />
          </SlideOverField>
          <SlideOverField
            label="Domains"
            helpText="Used to route logins to this identity provider by the domain of the user's email address."
          >
            <Controller
              name="domains"
              control={control}
              render={({ field }) => (
                <MultilineTextInput
                  value={field.value}
                  required
                  onChange={(e) => field.onChange(e.target?.value)}
                />
              )}
            />
          </SlideOverField>
          <SlideOverField
            label="Sync Attributes"
            helpText="Sync attributes from the identity provider to ThreatZero users."
          >
            <SyncAttributesInput />
          </SlideOverField>
          <SlideOverField
            label="Attribute Matchers"
            helpText={`Used during login to match a field passed from the identity provider to a user property.
            <br/><br/>
            <strong>External Name:</strong> The name of the attribute/claim passed in from the identity provider.<br/>
            <strong>Pattern:</strong> The pattern (in Regular Expression format) to match the attribute/claim to the unit.<br/>
            `}
          >
            <div>
              <div className="mb-2">
                <div className="sm:hidden">
                  <label htmlFor="tabs" className="sr-only">
                    Select a tab
                  </label>
                  {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
                  <select
                    id="tabs"
                    name="tabs"
                    defaultValue={ATTRIBUTE_MATCHER_TYPES[0]}
                    className="block w-full rounded-md border-gray-300 focus:border-secondary-500 focus:ring-secondary-500"
                  >
                    {ATTRIBUTE_MATCHER_TYPES.map((tab) => (
                      <option key={tab}>{tab}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <nav aria-label="Tabs" className="flex space-x-4">
                    {ATTRIBUTE_MATCHER_TYPES.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        aria-current={
                          selectedAttributeMatcherTab === tab
                            ? "page"
                            : undefined
                        }
                        className={classNames(
                          selectedAttributeMatcherTab === tab
                            ? "bg-secondary-100 text-secondary-700"
                            : "text-gray-500 hover:text-gray-700",
                          "rounded-md px-3 py-2 text-sm font-medium"
                        )}
                        onClick={() => setSelectedAttributeMatcherTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
              {selectedAttributeMatcherTab === "Units" ? (
                <UnitMatchersInput organizationId={organization.id} />
              ) : selectedAttributeMatcherTab === "Audiences" ? (
                <AudienceMatchersInput
                  allowedAudiences={organization.allowedAudiences}
                />
              ) : selectedAttributeMatcherTab === "Role Groups" ? (
                <RoleGroupMatchersInput
                  allowedRoleGroups={allowedRoleGroups ?? []}
                  checkDisabled={(rg) =>
                    DISABLED_ROLE_GROUPS.includes(rg.roleGroup)
                  }
                />
              ) : (
                <></>
              )}
            </div>
          </SlideOverField>
          <SlideOverField
            label="Default Role Groups"
            helpText="Role groups that will be assigned to all users."
          >
            <Controller
              name="defaultRoleGroups"
              control={control}
              render={({ field }) => (
                <MultipleSelect
                  prefix="organization_default_role_groups"
                  value={field.value}
                  options={(allowedRoleGroups ?? []).map((rg) => ({
                    key: rg,
                    label: rg,
                    disabled: DISABLED_ROLE_GROUPS.includes(rg),
                    disabledText:
                      "This role group can only be managed by identity admins.",
                  }))}
                  onChange={(ids) => field.onChange(ids)}
                />
              )}
            />
          </SlideOverField>
          <SlideOverField
            label="Default Audience"
            helpText="The audience that will be assigned to all users."
          >
            <Controller
              name="defaultAudience"
              control={control}
              render={({ field }) => (
                <Select
                  prefix="organization_default_audience"
                  value={field.value ?? ""}
                  options={organization.allowedAudiences.map((audience) => ({
                    key: audience,
                    label: audience,
                  }))}
                  onChange={(e) => field.onChange(e.target.value)}
                  showClear
                />
              )}
            />
          </SlideOverField>
          <SlideOverField
            label="Import Metadata"
            helpText="Import metadata from identity provider by URL or file."
          >
            <Controller
              name="importedConfig"
              control={control}
              render={({ field }) => (
                <IdpMetadataInput
                  name="importedConfig"
                  organizationId={organization.id}
                  protocol={protocol}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target?.value)}
                />
              )}
            />
          </SlideOverField>
        </SlideOverFormBody>
      </SlideOverForm>
    </FormProvider>
  );
};

export default EditOrganizationIdp;
