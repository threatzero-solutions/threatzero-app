import { useCallback, useContext, useEffect, useMemo } from "react";
import { Organization } from "../../../../types/entities";
import { slugify } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveOrganization,
  deleteOrganization,
  getOrganization,
} from "../../../../queries/organizations";
import FormInput from "../../../../components/forms/inputs/FormInput";
import { getResourceItems } from "../../../../queries/media";
import MultipleSelect from "../../../../components/forms/inputs/MultipleSelect";
import SafetyContactInput from "../../../../components/safety-management/SafetyContactInput";
import PolicyProcedureInput from "../../../../components/safety-management/PolicyProcedureInput";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import OrganizationIdpsInput from "../components/OrganizationIdpsInput";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import { CoreContext } from "../../../../contexts/core/core-context";
import CourseEnrollmentsInput from "../components/CourseEnrollmentsInput";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useDebounceCallback } from "usehooks-ts";

interface EditOrganizationProps {
  setOpen: (open: boolean) => void;
  organization?: Partial<Organization>;
}

const EditOrganization: React.FC<EditOrganizationProps> = ({
  setOpen,
  organization: organizationProp,
}) => {
  const isNew = useMemo(() => !organizationProp, [organizationProp]);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const { data: organizationData } = useQuery({
    queryKey: ["organizations", organizationProp?.id] as const,
    queryFn: ({ queryKey }) => getOrganization(queryKey[1]),
    enabled: !!organizationProp?.id,
    refetchOnWindowFocus: false,
  });

  const formMethods = useForm({
    values: organizationData,
  });
  const { handleSubmit, register, control, watch, setValue, getFieldState } =
    formMethods;

  const id = watch("id");
  const name = watch("name");
  const slug = watch("slug");
  const groupId = watch("groupId");
  const idpSlugs = watch("idpSlugs");
  const { isTouched: slugIsTouched } = getFieldState("slug");

  useEffect(() => {
    if (name && !slugIsTouched && !organizationData?.slug) {
      setValue("slug", slugify(name));
    }
  }, [name, slugIsTouched, setValue, organizationData?.slug]);

  const formatSlug = useCallback(
    (sl: string) => {
      if (!sl || sl === slugify(sl)) return;
      setValue("slug", slugify(sl));
    },
    [setValue]
  );
  const debounceFormatSlug = useDebounceCallback(formatSlug, 1000);

  useEffect(() => {
    debounceFormatSlug(slug);
  }, [slug, debounceFormatSlug]);

  const { data: resources } = useQuery({
    queryKey: ["resource-items", { limit: 100 }] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

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

  const handleSave = (data: Organization) => {
    saveOrganizationMutation.mutate({
      ...data,
      slug: slugify(data.slug ?? ""),
    });
  };

  const handleDelete = () => {
    setConfirmationOpen({
      title: `Delete ${name} Organization`,
      message: `Are you sure you want to delete this organization?
      This action cannot be undone.`,
      onConfirm: () => {
        deleteOrganizationMutation.mutate(id);
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
        hideDelete={isNew}
        onDelete={handleDelete}
        submitText={isNew ? "Add" : "Update"}
        isSaving={saveOrganizationMutation.isPending}
      >
        <SlideOverHeading
          title={isNew ? "Add organization" : "Edit organization"}
          description="Organizations can be school districts, companies, institutions,
                etc. These correlate to organizations registered in the identity
                provider."
          setOpen={setOpen}
        />
        {/* BASIC INFO */}
        <SlideOverFormBody>
          <SlideOverField
            label="Name"
            name="name"
            helpText="A friendly name for the organization."
          >
            <FormInput required type="text" {...register("name")} />
          </SlideOverField>
          <SlideOverField
            label="Slug"
            name="slug"
            helpText="The slug field must be unique."
          >
            <FormInput required type="text" {...register("slug")} />
          </SlideOverField>
          <SlideOverField label="Address (Optional)" name="address">
            <FormInput type="textarea" {...register("address")} />
          </SlideOverField>
          <SlideOverField
            label="Group ID"
            name="groupId"
            helpText="This id correlates with the organization's Group ID in the identity provider."
          >
            <FormInput
              type="text"
              disabled
              placeholder="Automatically generated"
              defaultValue={groupId ?? ""}
            />
          </SlideOverField>

          {/* SAFETY CONTACT AND POLICIES */}
          <SlideOverField label="Safety Contact" name="safetyContact">
            <Controller
              name="safetyContact"
              control={control}
              render={({ field }) => (
                <SafetyContactInput
                  value={field.value}
                  onChange={(e) => field.onChange(e.target?.value)}
                />
              )}
            />
          </SlideOverField>
          <SlideOverField
            label="Policies & Procedures"
            name="policiesAndProcedures"
          >
            <Controller
              name="policiesAndProcedures"
              control={control}
              render={({ field }) => (
                <PolicyProcedureInput
                  value={field.value}
                  onChange={(e) => field.onChange(e.target?.value)}
                />
              )}
            />
          </SlideOverField>

          {/* ENROLLMENT AND RESOURCE INFO */}
          <SlideOverField label="Course Enrollments" name="enrollments">
            <CourseEnrollmentsInput name="enrollments" />
          </SlideOverField>
          <SlideOverField label="Resources" name="resources">
            <Controller
              name="resources"
              control={control}
              render={({ field }) => (
                <MultipleSelect
                  prefix="organization_resources"
                  value={
                    field.value?.filter((r) => r.id).map((r) => r.id!) ?? []
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
                  onChange={(ids) => field.onChange(ids.map((id) => ({ id })))}
                />
              )}
            />
          </SlideOverField>

          {/* IDENTITY PROVIDERS */}
          <SlideOverField
            label="Identity Providers"
            name="idpSlugs"
            helpText="Used to set up SSO logins for this organization."
          >
            <>
              {id && (
                <OrganizationIdpsInput
                  organization={organizationData as Organization}
                  idpSlugs={idpSlugs ?? []}
                />
              )}
            </>
          </SlideOverField>
        </SlideOverFormBody>
      </SlideOverForm>
    </FormProvider>
  );
};

export default EditOrganization;
