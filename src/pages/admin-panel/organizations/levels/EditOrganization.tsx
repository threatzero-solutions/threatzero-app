import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Organization, Field, FieldType } from "../../../../types/entities";
import { orderSort, slugify } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveOrganization,
  deleteOrganization,
  getOrganization,
} from "../../../../queries/organizations";
import FormInput from "../../../../components/forms/inputs/FormInput";
import { useImmer } from "use-immer";
import { getTrainingCourses } from "../../../../queries/training";
import { getResourceItems } from "../../../../queries/media";
import { DeepPartial } from "../../../../types/core";
import MultipleSelect from "../../../../components/forms/inputs/MultipleSelect";
import PillBadge from "../../../../components/PillBadge";
import SafetyContactInput from "../../../../components/safety-management/SafetyContactInput";
import PolicyProcedureInput from "../../../../components/safety-management/PolicyProcedureInput";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import OrganizationIdpsInput from "../components/OrganizationIdpsInput";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import { CoreContext } from "../../../../contexts/core/core-context";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Organization }> = [
  {
    name: "name",
    label: "Name",
    helpText: "A friendly name for the organization.",
    type: FieldType.TEXT,
    required: true,
    order: 2,
  },
  {
    name: "slug",
    label: "Slug",
    helpText: "The slug field must be unique.",
    type: FieldType.TEXT,
    required: true,
    order: 3,
  },
  {
    name: "address",
    label: "Address (Optional)",
    type: FieldType.TEXTAREA,
    elementProperties: {
      rows: 3,
    },
    required: false,
    order: 4,
  },
  {
    name: "groupId",
    label: "Group ID",
    helpText:
      "This id correlates with the organization's Group ID in the identity provider.",
    placeholder: "Automatically generated",
    type: FieldType.TEXT,
    elementProperties: {
      disabled: true,
    },
    required: false,
    order: 5,
  },
  {
    name: "safetyContact",
    label: "Safety Contact",
    type: FieldType.TEXTAREA,
    elementProperties: {
      readOnly: true,
    },
    required: false,
    order: 6,
  },
  {
    name: "policiesAndProcedures",
    label: "Policies & Procedures",
    type: FieldType.TEXT,
    elementProperties: {
      readOnly: true,
    },
    required: false,
    order: 7,
  },
  {
    name: "courses",
    label: "Training Courses",
    type: FieldType.SELECT,
    required: false,
    order: 8,
  },
  {
    name: "resources",
    label: "Resources",
    type: FieldType.SELECT,
    required: false,
    order: 9,
  },
  {
    name: "idpSlugs",
    label: "Identity Providers",
    helpText: "Used to set up SSO logins for this organization.",
    type: FieldType.SELECT,
    required: false,
    order: 10,
  },
];

interface EditOrganizationProps {
  setOpen: (open: boolean) => void;
  organization?: Partial<Organization>;
}

const EditOrganization: React.FC<EditOrganizationProps> = ({
  setOpen,
  organization: organizationProp,
}) => {
  const [organization, setOrganization] = useImmer<DeepPartial<Organization>>(
    {}
  );

  const isNew = useMemo(() => !organizationProp, [organizationProp]);

  const createNewSlug = useRef(true);
  const slugDebounceTimeout = useRef<number>();

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const { data: organizationData } = useQuery({
    queryKey: ["organizations", organizationProp?.id] as const,
    queryFn: ({ queryKey }) => getOrganization(queryKey[1]),
    enabled: !!organizationProp?.id,
  });

  const { data: courses } = useQuery({
    queryKey: ["training-courses", { limit: 100 }] as const,
    queryFn: ({ queryKey }) => getTrainingCourses(queryKey[1]),
  });

  const { data: resources } = useQuery({
    queryKey: ["resource-items", { limit: 100 }] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

  useEffect(() => {
    if (organizationData) {
      createNewSlug.current = false;
      setOrganization(organizationData);
    }
  }, [organizationData]);

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["organizations"],
    });
    setOpen(false);
  };
  const saveOrganizationMutation = useMutation({
    mutationFn: saveOrganization,
    onSuccess: onMutateSuccess,
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      onMutateSuccess();
      setConfirmationClose();
    },
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = event.target.value;
    if (event.target.name === "slug") {
      value = slugify(value, false);

      createNewSlug.current = !value;

      clearTimeout(slugDebounceTimeout.current);
      slugDebounceTimeout.current = setTimeout(() => {
        setOrganization((a) => ({
          ...a,
          slug: slugify(value),
        }));
      }, 1000);
    }

    setOrganization((o) => {
      o[
        event.target.name as keyof Omit<
          Organization,
          | "courses"
          | "resources"
          | "policiesAndProcedures"
          | "idpSlugs"
          | "allowedAudiences"
        >
      ] = value;

      if (createNewSlug.current && event.target.name === "name") {
        o.slug = slugify(value);
      }
    });
  };

  const handleRelationChange = (
    name: "courses" | "resources",
    ids: string[]
  ) => {
    setOrganization((o) => {
      o[name] = ids.map((id) => ({ id }));
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    saveOrganizationMutation.mutate({
      ...organization,
      slug: slugify(organization.slug ?? ""),
    });
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${organization.name} Organization`,
      message: `Are you sure you want to delete this organization?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteOrganizationMutation.mutate(organization.id);
      },
      destructive: true,
      confirmText: "Delete",
    });
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
    >
      <SlideOverHeading
        title={isNew ? "Add organization" : "Edit organization"}
        description="Organizations can be school districts, companies, institutions,
                etc. These correlate to organizations registered in the identity
                provider."
        setOpen={setOpen}
      />

      <SlideOverFormBody>
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            {input.name === "safetyContact" ? (
              <SafetyContactInput
                value={organization.safetyContact}
                onChange={(e) =>
                  setOrganization((o) => ({
                    ...o,
                    safetyContact: e.target?.value,
                  }))
                }
              />
            ) : input.name === "policiesAndProcedures" ? (
              <PolicyProcedureInput
                value={organization.policiesAndProcedures}
                onChange={(e) =>
                  setOrganization((o) => ({
                    ...o,
                    policiesAndProcedures: e.target?.value ?? [],
                  }))
                }
              />
            ) : input.name === "courses" ? (
              <MultipleSelect
                prefix="organization_courses"
                value={
                  organization.courses?.filter((c) => c.id).map((c) => c.id!) ??
                  []
                }
                options={(courses?.results ?? []).map((c) => ({
                  key: c.id,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      {c.metadata.title}
                      {c.metadata.tag && (
                        <PillBadge
                          color={"secondary"}
                          value={c.metadata.tag}
                          displayValue={c.metadata.tag}
                        />
                      )}
                    </span>
                  ),
                }))}
                onChange={(ids) => handleRelationChange("courses", ids)}
              />
            ) : input.name === "resources" ? (
              <MultipleSelect
                prefix="organization_resources"
                value={
                  organization.resources
                    ?.filter((r) => r.id)
                    .map((r) => r.id!) ?? []
                }
                options={(resources?.results ?? []).map((r) => ({
                  key: r.id,
                  label: (
                    <div className="flex flex-col">
                      <span>{r.title}</span>
                      <span className="text-gray-500 text-xs">
                        {r.description}
                      </span>
                    </div>
                  ),
                }))}
                onChange={(ids) => handleRelationChange("resources", ids)}
              />
            ) : input.name === "idpSlugs" ? (
              <>
                {organization.id && (
                  <OrganizationIdpsInput
                    organization={organization as Organization}
                    idpSlugs={organization.idpSlugs ?? []}
                  />
                )}
              </>
            ) : (
              <FormInput
                field={input}
                onChange={handleChange}
                value={organization[input.name as keyof Organization] ?? ""}
              />
            )}
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganization;
