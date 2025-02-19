import { BoltIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Fragment, useCallback, useContext, useMemo } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import Checkbox from "../../../components/forms/inputs/Checkbox";
import Input from "../../../components/forms/inputs/Input";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import InlineNotice from "../../../components/layouts/InlineNotice";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import PillBadge from "../../../components/PillBadge";
import {
  TRAINING_PARTICIPANT_GROUP_NAME,
  TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
} from "../../../constants/organizations";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import {
  getOrganizationUsers,
  saveOrganizationUser,
} from "../../../queries/organizations";
import { getTrainingAudiences } from "../../../queries/training";
import { OrganizationUser } from "../../../types/api";
import { FieldType, Unit } from "../../../types/entities";
import AudiencesSelect from "../../training-library/components/AudiencesSelect";

interface EditOrganizationUserProps {
  setOpen: (open: boolean) => void;
  create: boolean;
  userId?: string;
}

const createUserSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email(),
  unitSlug: z.string().nonempty("Unit is required"),
  canAccessTraining: z.boolean().optional(),
  audienceSlugs: z.array(z.string()),
});

const createUserResolver = zodResolver(createUserSchema);

const updateUserSchema = createUserSchema.partial();

const updateUserResolver = zodResolver(updateUserSchema);

type TForm = z.infer<typeof createUserSchema & typeof updateUserSchema>;

const RELEVANT_USER_ATTRIBUTES = ["firstName", "lastName", "audience"];

const humanizeAttributeName = (name: string) =>
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const INITIAL_USER: TForm = {
  firstName: "",
  lastName: "",
  email: "",
  audienceSlugs: [],
  unitSlug: "",
};

const EditOrganizationUser: React.FC<EditOrganizationUserProps> = ({
  setOpen,
  create,
  userId,
}) => {
  const {
    currentOrganization: organization,
    currentUnitSlug: unitSlug,
    getMatchingIdp,
    getIdpAttributes,
    getIdpRoleGroups,
    invalidateOrganizationUsersQuery,
  } = useContext(OrganizationsContext);

  const { data: userData } = useQuery({
    queryKey: [
      "organizations-user",
      organization?.id,
      userId,
      {
        unit: unitSlug,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationUsers(queryKey[1], {
        id: queryKey[2],
        ...queryKey[3],
      }).then((users) => {
        if (users.results.length > 0) {
          return users.results[0];
        }
        throw new Error("User not found.");
      }),
    enabled: !!userId,
  });

  const { data: allAudiences } = useQuery({
    queryKey: ["training-audiences"] as const,
    queryFn: () => getTrainingAudiences({ limit: 1000 }),
  });

  const allowedAudiences = useMemo(
    () =>
      allAudiences?.results.filter((a) =>
        organization?.allowedAudiences.includes(a.slug)
      ) ?? [],
    [organization, allAudiences]
  );

  const mapAudiences = useCallback(
    (audiences: string[]) => {
      return (
        allowedAudiences.filter((audience) =>
          audiences.includes(audience.slug)
        ) ?? []
      );
    },
    [allowedAudiences]
  );

  const formDefaultValues = useMemo(() => {
    return userData
      ? toTransientUser(userData)
      : {
          ...INITIAL_USER,
          unitSlug: unitSlug ?? "",
        };
  }, [unitSlug, userData]);

  const formMethods = useForm<TForm>({
    resolver: (create
      ? createUserResolver
      : updateUserResolver) as Resolver<TForm>,
    values: formDefaultValues,
  });

  const { register, handleSubmit, watch, getFieldState, formState } =
    formMethods;

  const { isDirty } = formState;

  const email = watch("email");
  const canAccessTraining = watch("canAccessTraining");

  const matchingIdp = useMemo(
    () => (email ? getMatchingIdp(email) : null),
    [email, getMatchingIdp]
  );
  const idpAttributes = useMemo(
    () => getIdpAttributes(matchingIdp),
    [getIdpAttributes, matchingIdp]
  );
  const idpRoleGroups = useMemo(
    () => getIdpRoleGroups(matchingIdp),
    [getIdpRoleGroups, matchingIdp]
  );
  const displayIdpAttributes = useMemo(() => {
    const autoAttributes = idpAttributes
      .filter((a) => RELEVANT_USER_ATTRIBUTES.includes(a))
      .map(humanizeAttributeName);

    if (idpRoleGroups.includes(TRAINING_PARTICIPANT_GROUP_NAME)) {
      autoAttributes.push("training access");
    }

    return autoAttributes;
  }, [idpAttributes, idpRoleGroups]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (user: TForm) =>
      organization
        ? saveOrganizationUser(organization.id, toOrgUser(user))
        : Promise.reject(new Error("No organization")),
    onSuccess: () => {
      invalidateOrganizationUsersQuery();
      setOpen(false);
    },
  });

  const handleSave = (user: TForm) => {
    save(user);
  };

  const unitSlugState = getFieldState("unitSlug", formState);

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
        title={create ? "Add User" : "Edit User"}
        description=""
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <SlideOverField name="email" label="Email">
          <Input
            type={FieldType.EMAIL}
            required
            {...register("email")}
            className="w-full"
          />
          {email && matchingIdp && (
            <InlineNotice
              level="info"
              heading={
                <>
                  <BoltIcon className="size-3 inline text-green-500" /> This
                  email domain ({email.split("@").at(-1)}) is linked to SSO
                </>
              }
              body={
                <>
                  When a user logs in with this email, they will be logged in
                  via SSO. This may overwrite any changes made to their{" "}
                  {displayIdpAttributes.map((a, idx) => (
                    <Fragment key={a}>
                      {idx > 0 &&
                        idx === displayIdpAttributes.length - 1 &&
                        "or "}
                      <span className="font-semibold">{a}</span>
                      {idx < displayIdpAttributes.length - 1
                        ? displayIdpAttributes.length > 2
                          ? ", "
                          : " "
                        : ""}
                    </Fragment>
                  ))}
                  .
                </>
              }
            />
          )}
        </SlideOverField>
        <SlideOverField name="firstName" label="First Name">
          <Input
            type={FieldType.TEXT}
            required
            {...register("firstName")}
            className="w-full"
          />
          {idpAttributes.includes("firstName") && <SSOField />}
        </SlideOverField>
        <SlideOverField name="lastName" label="Last Name">
          <Input
            type={FieldType.TEXT}
            required
            {...register("lastName")}
            className="w-full"
          />
          {idpAttributes.includes("lastName") && <SSOField />}
        </SlideOverField>
        {organization && !formDefaultValues.unitSlug && (
          <SlideOverField name="unitSlug" label="Unit">
            <Controller
              name="unitSlug"
              control={formMethods.control}
              render={({ field }) => (
                <UnitSelect
                  value={field.value}
                  onChange={(a) =>
                    field.onChange(
                      a.target?.value
                        ? (a.target.value as unknown as Unit).slug
                        : ""
                    )
                  }
                  queryFilter={{ ["organization.id"]: organization.id }}
                />
              )}
            />
            {unitSlugState.error?.message && (
              <p className="text-red-500">{unitSlugState.error.message}</p>
            )}
            {idpAttributes.includes("unit") && <SSOField />}
          </SlideOverField>
        )}
        {(!userData || canAccessTraining !== undefined) && (
          <SlideOverField
            name="trainingParticipant"
            label="Can Access Training"
          >
            <Controller
              name="canAccessTraining"
              control={formMethods.control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            {idpRoleGroups.includes(TRAINING_PARTICIPANT_GROUP_NAME) && (
              <SSOField />
            )}
          </SlideOverField>
        )}
        <SlideOverField
          name="audienceSlugs"
          label="Training Groups"
          helpText={
            "Training groups determine which training courses this user will have access to."
          }
          discreetHelpText
        >
          <Controller
            name="audienceSlugs"
            control={formMethods.control}
            render={({ field }) => (
              <AudiencesSelect
                value={mapAudiences(field.value ?? [])}
                onChange={(e) =>
                  field.onChange(e.target?.value?.map((a) => a.slug))
                }
                disabled={!canAccessTraining}
                propertyNameSingular="training group"
                propertyNamePlural="training groups"
                allowedAudiences={allowedAudiences}
              />
            )}
          />
          {idpAttributes.includes("audience") && <SSOField />}
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationUser;

const SSOField = () => (
  <PillBadge
    displayValue={
      <>
        <BoltIcon className="size-3" /> SSO field
      </>
    }
    color="green"
  />
);

const toOrgUser = (user: TForm): Partial<OrganizationUser> => ({
  id: "id" in user ? user.id : undefined,
  username: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  attributes: {
    audience: user.audienceSlugs,
    ...(user.unitSlug ? { unit: [user.unitSlug] } : {}),
  },
  canAccessTraining: user.canAccessTraining,
});

const toTransientUser = (
  orgUser: OrganizationUser,
  unitSlug?: string
): TForm => ({
  id: orgUser.id,
  firstName: orgUser.firstName,
  lastName: orgUser.lastName,
  email: orgUser.email,
  unitSlug: orgUser.attributes.unit?.at(0) ?? unitSlug ?? "",
  audienceSlugs: orgUser.attributes.audience ?? [],
  canAccessTraining:
    orgUser.canAccessTraining ??
    orgUser.groups?.includes(TRAINING_PARTICIPANT_ROLE_GROUP_PATH),
});
