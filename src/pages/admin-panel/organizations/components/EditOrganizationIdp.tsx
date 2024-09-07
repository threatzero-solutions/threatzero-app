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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOrganizationIdp,
  deleteOrganizationIdp,
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

const DEFAULT_ROLE_GROUPS = ["Training Participant"];
const SERVICE_PROVIDER_ENTITY_ID =
  "https://auth.threatzero.org/realms/threatzero";
const SERVICE_PROVIDER_REDIRECT_URL = (slug: string) =>
  `https://auth.threatzero.org/realms/threatzero/broker/${slug}/endpoint`;

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
    name: "unitMatchers",
    label: "Unit Matchers",
    helpText: `Used during login to match a field passed from the identity provider to a unit.
      <br/><br/>
      <strong>External Name:</strong> The name of the attribute/claim passed in from the identity provider.<br/>
      <strong>Pattern:</strong> The pattern (in Regular Expression format) to match the attribute/claim to the unit.<br/>
      <strong>Unit:</strong> The unit to assign matching users to.<br/>
      `,
    type: FieldType.SELECT,
    required: false,
    order: 4,
  },
  {
    name: "defaultRoleGroups",
    label: "Default Role Groups",
    helpText: "Role groups that will be assigned to new users.",
    type: FieldType.SELECT,
    required: false,
    order: 5,
  },
  {
    name: "importedConfig",
    label: "Import Metadata",
    helpText: "Import metadata from identity provider by URL or file.",
    type: FieldType.TEXT,
    required: true,
    order: 6,
  },
];

interface EditOrganizationIdpProps {
  organizationId: Organization["id"];
  idp: OrganizationIdpDto | undefined;
  setOpen: (open: boolean) => void;
}

const INITIAL_IDP: OrganizationIdpDto = {
  name: "",
  slug: "",
  protocol: "saml",
  domains: [],
  unitMatchers: [],
  defaultRoleGroups: [],
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

const EditOrganizationIdp: React.FC<EditOrganizationIdpProps> = ({
  organizationId,
  idp: idpProp,
  setOpen,
}) => {
  const [idp, setIdp] = useImmer(idpProp ?? INITIAL_IDP);
  const isNew = !idpProp;
  const originalSlug = idpProp?.slug;

  const createNewSlug = useRef(true);
  const slugDebounceTimeout = useRef<number>();

  const [showCopyableConfig, setShowCopyableConfig] = useState(isNew);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const queryClient = useQueryClient();
  const createIdpMutation = useMutation({
    mutationFn: (idp: OrganizationIdpDto) =>
      isNew
        ? createOrganizationIdp(organizationId, idp)
        : updateOrganizationIdp(organizationId, originalSlug as string, idp),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-idps", organizationId, originalSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["organizations", organizationId],
      });
      setOpen(false);
    },
  });

  const deleteIdpMutation = useMutation({
    mutationFn: () =>
      deleteOrganizationIdp(organizationId, originalSlug as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizations", organizationId],
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
            ) : input.name === "unitMatchers" ? (
              <UnitMatchersInput
                name="unitMatchers"
                value={idp.unitMatchers}
                onChange={handleChange}
                organizationId={organizationId}
              />
            ) : input.name === "defaultRoleGroups" ? (
              <MultipleSelect
                key={input.name}
                prefix="organization_resources"
                value={idp.defaultRoleGroups}
                options={DEFAULT_ROLE_GROUPS.map((rg) => ({
                  key: rg,
                  label: rg,
                }))}
                onChange={(ids) =>
                  handleChange({ target: { name: input.name, value: ids } })
                }
              />
            ) : input.name === "importedConfig" ? (
              <IdpMetadataInput
                name={input.name}
                organizationId={organizationId}
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
