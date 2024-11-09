import { useContext, useMemo, useState } from "react";
import { Organization } from "../../../../types/entities";
import { slugify } from "../../../../utils/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveOrganization,
  deleteOrganization,
  getOrganization,
} from "../../../../queries/organizations";
import { getResourceItems } from "../../../../queries/media";
import MultipleSelect from "../../../../components/forms/inputs/MultipleSelect";
import SafetyContactInput from "../../../../components/safety-management/SafetyContactInput";
import PolicyProcedureInput from "../../../../components/safety-management/PolicyProcedureInput";
import OrganizationIdpsInput from "../components/OrganizationIdpsInput";
import { CoreContext } from "../../../../contexts/core/core-context";
import CourseEnrollmentsInput from "../components/CourseEnrollmentsInput";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useAuth } from "../../../../contexts/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
import LargeFormSection from "../../../../components/forms/LargeFormSection";
import FormField from "../../../../components/forms/FormField";
import BackButtonLink from "../../../../components/layouts/BackButtonLink";
import SuccessButton from "../../../../components/layouts/buttons/SuccessButton";
import { useAutoSlug } from "../../../../hooks/use-auto-slug";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import Input from "../../../../components/forms/inputs/Input";
import { useInterval } from "usehooks-ts";

const EditOrganization: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const isNew = useMemo(() => params.id === "new", [params.id]);

  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);
  const { myOrganizationSlug } = useAuth();

  const { data: organizationData, refetch } = useQuery({
    queryKey: ["organization", "id", params.id] as const,
    queryFn: ({ queryKey }) => getOrganization(queryKey[2]),
    enabled: !isNew,
    refetchOnWindowFocus: false,
  });

  // Group ID is generated asynchronously, so easiest thing is to refetch every 500ms
  // until it is generated.
  const [refetchAttempts, setRefetchAttempts] = useState(0);
  useInterval(
    () => {
      setRefetchAttempts((prev) => prev + 1);
      refetch();
    },
    organizationData && !organizationData.groupId && refetchAttempts < 5
      ? 500
      : null
  );

  const formMethods = useForm({
    values: organizationData,
  });
  const { handleSubmit, register, control, watch } = formMethods;

  const id = watch("id");
  const name = watch("name");
  const idpSlugs = watch("idpSlugs");

  const { registerSlug, resetSlug } = useAutoSlug({
    ...formMethods,
    defaultSlug: organizationData?.slug,
  });

  const { data: resources } = useQuery({
    queryKey: ["resource-items", { limit: 100 }] as const,
    queryFn: ({ queryKey }) => getResourceItems(queryKey[1]),
  });

  const queryClient = useQueryClient();
  const saveOrganizationMutation = useMutation({
    mutationFn: saveOrganization,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organizations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", "id", data.id],
      });
      if (myOrganizationSlug === data.slug) {
        queryClient.invalidateQueries({
          queryKey: ["my-course-enrollments"],
        });
      }

      navigate(`../${data.id}`);
    },
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizations"],
      });
      setConfirmationClose();
      navigate("../");
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
      <BackButtonLink to={"../"} value={"Back to Organizations"} />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="border-b border-gray-900/10 pb-4"
      >
        <div className="grid grid-cols-1 gap-y-4 pb-8">
          <LargeFormSection heading="General" defaultOpen>
            <div className="space-y-4">
              <FormField
                required
                type="text"
                {...register("name")}
                field={{
                  name: "name",
                  label: "Name",
                  helpText: "A friendly name for the organization.",
                }}
              />
              <FormField
                field={{
                  label: "Slug",
                  helpText: "The slug field must be unique.",
                }}
                input={
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
                }
              />
              <FormField
                type="textarea"
                {...register("address")}
                rows={3}
                field={{
                  label: "Address (Optional)",
                  name: "address",
                }}
              />
              <FormField
                type="text"
                disabled
                placeholder={
                  organizationData
                    ? "Automatically generating..."
                    : "Automatically generated"
                }
                value={organizationData?.groupId ?? ""}
                field={{
                  label: "Group ID",
                  name: "groupId",
                  helpText:
                    "This id correlates with the organization's Group ID in the identity provider.",
                }}
              />
            </div>
          </LargeFormSection>

          <LargeFormSection heading="Safety Management">
            <div className="space-y-6">
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
            </div>
          </LargeFormSection>

          <LargeFormSection heading="Training">
            <div className="space-y-6">
              <CourseEnrollmentsInput
                name="enrollments"
                label="Course Enrollments"
                helpText="Enroll this organizaton in courses to grant them access to the correct training."
                organizationId={id}
                accessSettings={organizationData?.trainingAccessSettings}
              />
              <FormField
                field={{
                  name: "resources",
                  label: "Resources",
                  helpText:
                    "Select resources that this organization will have access to.",
                }}
                helpTextFirst
                input={
                  <Controller
                    name="resources"
                    control={control}
                    render={({ field }) => (
                      <MultipleSelect
                        prefix="organization_resources"
                        value={
                          field.value?.filter((r) => r.id).map((r) => r.id!) ??
                          []
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
                        onChange={(ids) =>
                          field.onChange(ids.map((id) => ({ id })))
                        }
                      />
                    )}
                  />
                }
              />
            </div>
          </LargeFormSection>

          <LargeFormSection heading="User Accounts">
            <div className="6">
              <FormField
                field={{
                  label: "Identity Providers",
                  name: "idpSlugs",
                  helpText: "Used to set up SSO logins for this organization.",
                }}
                helpTextFirst
                input={
                  <>
                    {id && (
                      <OrganizationIdpsInput
                        organization={organizationData as Organization}
                        idpSlugs={idpSlugs ?? []}
                      />
                    )}
                  </>
                }
              />
            </div>
          </LargeFormSection>
        </div>
        <div className="flex">
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
          <SuccessButton
            isLoading={saveOrganizationMutation.isPending}
            isSuccess={saveOrganizationMutation.isSuccess}
          >
            {isNew ? "Create" : "Save"}
          </SuccessButton>
        </div>
      </form>
    </FormProvider>
  );
};

export default EditOrganization;
