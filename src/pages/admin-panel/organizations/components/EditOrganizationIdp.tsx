import FormInput from "../../../../components/forms/inputs/FormInput";
import MultilineTextInput from "../../../../components/forms/inputs/MultilineTextInput";
import MultipleSelect from "../../../../components/forms/inputs/MultipleSelect";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import { OrganizationIdpDto } from "../../../../types/api";
import { Field, FieldType, Organization } from "../../../../types/entities";
import { classNames, orderSort, slugify } from "../../../../utils/core";
import { SimpleChangeEvent } from "../../../../types/core";
import { useImmer } from "use-immer";
import IdpMetadataInput from "./IdpMetadataInput";
import { FormEvent, useContext, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganizationIdp,
  deleteOrganizationIdp,
  getOrganizationIdpRoleGroups,
  updateOrganizationIdp,
} from "../../../../queries/organizations";
import Input from "../../../../components/forms/inputs/Input";
import {
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

const SERVICE_PROVIDER_ENTITY_ID =
  "https://auth.threatzero.org/realms/threatzero";
const SERVICE_PROVIDER_REDIRECT_URL = (slug: string) =>
  `https://auth.threatzero.org/realms/threatzero/broker/${slug}/endpoint`;

const DISABLED_ROLE_GROUPS = ["ThreatZero Administrator"];

const INPUT_DATA: Array<Partial<Field> & { name: keyof OrganizationIdpDto }> = [
  {
    name: "name",
    label: "Name",
    helpText: "Name of the identity provider.",
    type: FieldType.TEXT,
    required: true,
    order: 0,
  },
  {
    name: "slug",
    label: "Slug",
    helpText:
      "<strong>This field will automatically populate from the name.</strong> Similar to the name, the slug is used in the redirect URL and must be URL safe.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
  {
    name: "protocol",
    label: "Protocol",
    helpText: "The protocol of the identity provider, either SAML or OIDC.",
    type: FieldType.SELECT,
    typeParams: {
      options: {
        saml: "SAML 2.0",
        oidc: "OpenID Connect",
      },
    },
    required: true,
    order: 2,
  },
  {
    name: "domains",
    label: "Domains",
    helpText:
      "Used to route logins to this identity provider by the domain of the user's email address.",
    type: FieldType.TEXT,
    required: true,
    order: 3,
  },
  {
    name: "attributeMatchers" as keyof OrganizationIdpDto,
    label: "Attribute Matchers",
    helpText: `Used during login to match a field passed from the identity provider to a user property.
      <br/><br/>
      <strong>External Name:</strong> The name of the attribute/claim passed in from the identity provider.<br/>
      <strong>Pattern:</strong> The pattern (in Regular Expression format) to match the attribute/claim to the unit.<br/>
      `,
    type: FieldType.SELECT,
    required: false,
    order: 4,
  },
  {
    name: "defaultRoleGroups",
    label: "Default Role Groups",
    helpText: "Role groups that will be assigned to all users.",
    type: FieldType.SELECT,
    required: false,
    order: 5,
  },
  {
    name: "defaultAudience",
    label: "Default Audience",
    helpText: "Audience that will be assigned to all users.",
    type: FieldType.SELECT,
    required: false,
    order: 6,
  },
  {
    name: "importedConfig",
    label: "Import Metadata",
    helpText: "Import metadata from identity provider by URL or file.",
    type: FieldType.TEXT,
    required: true,
    order: 7,
  },
];

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
  const { setSuccess } = useContext(CoreContext);

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
  const [idp, setIdp] = useImmer(idpProp ?? INITIAL_IDP);
  const isNew = !idpProp;
  const originalSlug = idpProp?.slug;

  const createNewSlug = useRef(true);
  const slugDebounceTimeout = useRef<number>();

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
        queryKey: ["organizations", organization.id],
      });
      setOpen(false);
    },
  });

  const deleteIdpMutation = useMutation({
    mutationFn: () =>
      deleteOrganizationIdp(organization.id, originalSlug as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizations", organization.id],
      });
      setConfirmationClose();
      setOpen(false);
    },
  });

  const handleChange = (
    e: SimpleChangeEvent<
      OrganizationIdpDto[keyof OrganizationIdpDto],
      keyof OrganizationIdpDto
    >
  ) => {
    if (!e.target) return;
    let { name, value } = e.target;

    if (name === "slug") {
      value = slugify(value as string, false);

      createNewSlug.current = !value;

      clearTimeout(slugDebounceTimeout.current);
      slugDebounceTimeout.current = setTimeout(() => {
        setIdp((a) => ({
          ...a,
          slug: slugify(value as string),
        }));
      }, 1000);
    }

    setIdp((i) => {
      i[name] = value as any;

      if (createNewSlug.current && name === "name") {
        i.slug = slugify(value as string);
      }
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    createIdpMutation.mutate(idp);
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${idp.name} IDP`,
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
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      onDelete={handleDelete}
      hideDelete={isNew}
      submitText={isNew ? "Add" : "Update"}
      isSaving={createIdpMutation.isPending}
    >
      <SlideOverHeading
        title={!isNew ? "Edit Identity Provider" : "Add Identity Provider"}
        description={`Copy configuration values below to paste into your ${idp.protocol.toUpperCase()} provider.`}
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
                value={idp.slug ? SERVICE_PROVIDER_REDIRECT_URL(idp.slug) : ""}
                label={`Redirect${idp.protocol === "saml" ? " / ACS" : ""} URL`}
              />
              {idp.protocol === "saml" && (
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
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.id ?? input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            {input.name === "domains" ? (
              <MultilineTextInput
                key={input.name}
                name={input.name}
                value={idp.domains}
                required={input.required}
                onChange={handleChange}
              />
            ) : input.name ===
              ("attributeMatchers" as keyof OrganizationIdpDto) ? (
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
                  <UnitMatchersInput
                    name="unitMatchers"
                    value={idp.unitMatchers}
                    onChange={handleChange}
                    organizationId={organization.id}
                  />
                ) : selectedAttributeMatcherTab === "Audiences" ? (
                  <AudienceMatchersInput
                    name="audienceMatchers"
                    value={idp.audienceMatchers}
                    onChange={handleChange}
                    allowedAudiences={organization.allowedAudiences}
                  />
                ) : selectedAttributeMatcherTab === "Role Groups" ? (
                  <RoleGroupMatchersInput
                    name="roleGroupMatchers"
                    value={idp.roleGroupMatchers}
                    onChange={handleChange}
                    allowedRoleGroups={allowedRoleGroups ?? []}
                    checkDisabled={(rg) =>
                      DISABLED_ROLE_GROUPS.includes(rg.roleGroup)
                    }
                  />
                ) : (
                  <></>
                )}
              </div>
            ) : input.name === "defaultRoleGroups" ? (
              <MultipleSelect
                key={input.name}
                prefix="organization_default_role_groups"
                value={idp.defaultRoleGroups}
                options={(allowedRoleGroups ?? []).map((rg) => ({
                  key: rg,
                  label: rg,
                  disabled: DISABLED_ROLE_GROUPS.includes(rg),
                  disabledText:
                    "This role group can only be managed by identity admins.",
                }))}
                onChange={(ids) =>
                  handleChange({ target: { name: input.name, value: ids } })
                }
              />
            ) : input.name === "defaultAudience" ? (
              <Select
                key={input.name}
                prefix="organization_default_audience"
                value={idp.defaultAudience ?? ""}
                options={organization.allowedAudiences.map((audience) => ({
                  key: audience,
                  label: audience,
                }))}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: input.name,
                      value: e.target.value || null,
                    },
                  })
                }
                showClear
              />
            ) : input.name === "importedConfig" ? (
              <IdpMetadataInput
                name={input.name}
                organizationId={organization.id}
                protocol={idp.protocol}
                value={idp.importedConfig}
                onChange={handleChange}
              />
            ) : (
              <FormInput
                field={input}
                value={idp[input.name] ?? ""}
                onChange={handleChange}
                key={input.name}
              />
            )}
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationIdp;
