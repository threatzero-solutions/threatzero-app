import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import TextArea from "../../../components/forms/inputs/TextArea";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { useAutoSlug } from "../../../hooks/use-auto-slug";
import {
  getUnit,
  isUnitSlugUnique,
  saveLocation,
  saveUnit,
  isOrganizationSlugUnique,
  getOrganization,
  saveOrganization,
} from "../../../queries/organizations";
import {
  FieldType,
  OrganizationBase,
  Base,
  Unit,
  Organization,
} from "../../../types/entities";
import { slugify, classNames } from "../../../utils/core";
import Input from "../../../components/forms/inputs/Input";
import Checkbox from "../../../components/forms/inputs/Checkbox";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import { useAuth } from "../../../contexts/auth/useAuth";

interface EditOrganizationBasicProps {
  setOpen: (open: boolean) => void;
  create: boolean;
  level: "organization" | "unit";
  unitId?: string;
  organizationId: string;
  parentUnitId?: string;
}

type OrganizationBaseValue = Omit<
  OrganizationBase,
  "safetyContact" | "policiesAndProcedures" | keyof Base
> &
  Partial<Base> & {
    parentUnit?: Pick<Unit, "id"> | null;
    organization?: Pick<Organization, "id">;
  };

const INITIAL_ORGANIZATION_BASE: OrganizationBaseValue = {
  name: "",
  slug: "",
  address: "",
};

const EditOrganizationBasic: React.FC<EditOrganizationBasicProps> = ({
  setOpen,
  level,
  unitId,
  organizationId,
  create,
  parentUnitId,
}) => {
  const { isGlobalAdmin } = useAuth();

  const { invalidateOrganizationQuery, invalidateCurrentUnitQuery } =
    useContext(MyOrganizationContext);

  const { data: organizationData } = useQuery({
    queryKey: ["organization", "id", organizationId] as const,
    queryFn: ({ queryKey }) => getOrganization(queryKey[2]),
    enabled: level === "organization",
  });

  const { data: unitData } = useQuery({
    queryKey: ["unit", "id", unitId] as const,
    queryFn: ({ queryKey }) => getUnit(queryKey[2]),
    enabled: level === "unit" && !!unitId,
  });

  const [autoAddLocation, setAutoAddLocation] = useState(false);

  const isOrganization = level === "organization";

  const data = useMemo(() => {
    const baseData: OrganizationBaseValue =
      (isOrganization ? organizationData : unitData) ??
      INITIAL_ORGANIZATION_BASE;

    const data: OrganizationBaseValue = {
      id: baseData.id,
      name: baseData.name,
      slug: baseData.slug,
      address: baseData.address,
    };

    if (!isOrganization) {
      data.parentUnit =
        baseData.parentUnit ??
        (parentUnitId ? { id: parentUnitId } : undefined);
      data.organization = baseData.organization ?? { id: organizationId };
    }

    return data;
  }, [
    isOrganization,
    organizationData,
    unitData,
    parentUnitId,
    organizationId,
  ]);

  const formMethods = useForm({
    values: data,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = formMethods;

  const name = watch("name");
  const slug = watch("slug");

  const { registerSlug, resetSlug } = useAutoSlug({
    ...formMethods,
    defaultSlug: data.slug,
  });

  const [debouncedSlug] = useDebounceValue(slug, 200);
  const { data: unitSlugUniqueResponse } = useQuery({
    queryKey: ["units", "unique-slug", organizationId, debouncedSlug] as const,
    queryFn: ({ queryKey }) => isUnitSlugUnique(queryKey[2]!, queryKey[3]!),
    enabled: !isOrganization && !!debouncedSlug && debouncedSlug !== data.slug,
  });
  const { data: organizationSlugUniqueResponse } = useQuery({
    queryKey: ["organizations", "unique-slug", debouncedSlug] as const,
    queryFn: ({ queryKey }) => isOrganizationSlugUnique(queryKey[2]!),
    enabled: isOrganization && !!debouncedSlug && debouncedSlug !== data.slug,
  });

  const isUniqueSlug = useMemo(() => {
    const slugUniqueResponse = isOrganization
      ? organizationSlugUniqueResponse
      : unitSlugUniqueResponse;
    const existingSlug = isOrganization
      ? organizationData?.slug
      : unitData?.slug;
    return (
      debouncedSlug === existingSlug ||
      !slugUniqueResponse ||
      slugUniqueResponse.isUnique
    );
  }, [
    isOrganization,
    debouncedSlug,
    unitData?.slug,
    organizationData?.slug,
    unitSlugUniqueResponse,
    organizationSlugUniqueResponse,
  ]);

  const slugReadOnly = useMemo(
    () => !organizationId || (!create && !isGlobalAdmin),
    [organizationId, create, isGlobalAdmin]
  );

  const queryClient = useQueryClient();
  const saveLocationMutation = useMutation({
    mutationFn: saveLocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["location", "id", data.id],
      });
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: OrganizationBaseValue) =>
      (isOrganization
        ? saveOrganization(data)
        : saveUnit(data)) as Promise<OrganizationBaseValue>,
    onSuccess: (data) => {
      if (!isOrganization && autoAddLocation) {
        saveLocationMutation.mutate({
          name: data.name,
          unit: {
            id: data.id,
          },
        });
      }

      setOpen(false);

      if (isOrganization) invalidateOrganizationQuery();
      else invalidateCurrentUnitQuery();
    },
  });

  const handleSave = (orgUnit: OrganizationBaseValue) => {
    orgUnit.slug = slugify(orgUnit.slug ?? "");
    save(orgUnit);
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit(handleSave)}
      onClose={() => setOpen(false)}
      hideDelete
      submitText={create ? "Add" : "Save"}
      isSaving={isPending}
      submitDisabled={!isDirty}
    >
      <SlideOverHeading
        title={`${create ? "Add" : "Edit"} ${
          isOrganization ? "Organization" : "Unit"
        }`}
        description={
          isOrganization
            ? ``
            : `Units are the parts that make up an organization, such as a
                school in a district. They generally represent a school, office,
                or other general location where unit members work or attend
                school.`
        }
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <SlideOverField
          name="name"
          label="Name"
          helpText={`A friendly name for this ${level}.`}
        >
          <Input
            type={FieldType.TEXT}
            required
            disabled={!organizationId}
            {...register("name")}
            className="w-full"
          />
        </SlideOverField>
        <SlideOverField
          name="slug"
          label="Slug"
          helpText="The slug field must be unique."
        >
          <div className="relative">
            {!slugReadOnly && (
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {!isUniqueSlug ? (
                  <ExclamationCircleIcon
                    className="size-5 text-red-500"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircleIcon
                    className={classNames(
                      "size-5 text-green-500",
                      !slug ? "grayscale" : ""
                    )}
                    aria-hidden="true"
                  />
                )}
              </span>
            )}
            <Input
              type={FieldType.TEXT}
              required
              {...registerSlug({
                validate: () => isUniqueSlug,
              })}
              disabled={!organizationId || slugReadOnly}
              className={classNames(
                "w-full",
                slugReadOnly ? "" : "pr-7 pl-10",
                slug && !slugReadOnly
                  ? !isUniqueSlug
                    ? "ring-red-300 text-red-900 focus:!ring-red-500"
                    : "ring-green-300 text-green-900 focus:!ring-green-500"
                  : ""
              )}
              autoComplete="off"
            />
            <button
              type="button"
              className={classNames(
                "group absolute right-2 top-1/2 -translate-y-1/2 disabled:opacity-50",
                slugReadOnly ? "hidden" : ""
              )}
              title="Generate slug from name"
              onClick={() => resetSlug()}
              disabled={!name}
            >
              <ArrowPathIcon className="size-4 group-hover:group-enabled:rotate-180 duration-500 transition-transform" />
            </button>
          </div>
          {!isUniqueSlug && (
            <span className="text-xs text-red-500 mt-1">
              Slug "{slug}" is already in use within this organization.
            </span>
          )}
        </SlideOverField>
        <SlideOverField name="address" label="Address (Optional)">
          <TextArea {...register("address")} rows={3} className="w-full" />
        </SlideOverField>
        {create && !isOrganization && (
          <SlideOverField
            name="autoAddLocation"
            label="Automatically Add Location"
          >
            <Checkbox
              onChange={(checked) => setAutoAddLocation(checked)}
              checked={autoAddLocation}
            />
          </SlideOverField>
        )}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationBasic;
