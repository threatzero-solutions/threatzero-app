import { ChangeEvent, FormEvent, useEffect, useMemo, useRef } from "react";
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
    onSuccess: onMutateSuccess,
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
          "courses" | "resources" | "policiesAndProcedures" | "idpSlugs"
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
    deleteOrganizationMutation.mutate(organization.id);
  };

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        <SlideOverHeading
          title={isNew ? "Add organization" : "Edit organization"}
          description="Organizations can be school districts, companies, institutions,
                etc. These correlate to organizations registered in the identity
                provider."
          setOpen={setOpen}
        />

        {/* Divider container */}
        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          {INPUT_DATA.sort(orderSort).map((input) => (
            <div
              key={input.name}
              className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5"
            >
              <div>
                <label
                  htmlFor={input.name}
                  className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
                >
                  {input.label}
                </label>
              </div>
              <div className="sm:col-span-2 space-y-2">
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
                      organization.courses
                        ?.filter((c) => c.id)
                        .map((c) => c.id!) ?? []
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
                        organizationId={organization.id}
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
                {input.helpText && (
                  <p className="text-sm text-gray-500">{input.helpText}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          {!isNew && (
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <div className="grow" />
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditOrganization;
