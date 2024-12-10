import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import Checkbox from "../../../components/forms/inputs/Checkbox";
import Input from "../../../components/forms/inputs/Input";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from "../../../constants/organizations";
import { MyOrganizationContext } from "../../../contexts/my-organization/my-organization-context";
import {
  assignOrganizationUserToRoleGroup,
  getOrganizationUsers,
  revokeOrganizationUserToRoleGroup,
  saveOrganizationUser,
} from "../../../queries/organizations";
import { getTrainingAudiences } from "../../../queries/training";
import { OrganizationUser } from "../../../types/api";
import { FieldType } from "../../../types/entities";
import AudiencesSelect from "../../training-library/components/AudiencesSelect";

interface EditOrganizationUserProps {
  setOpen: (open: boolean) => void;
  create: boolean;
  userId?: string;
}

interface TransientUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  unitSlug?: string;
  canAccessTraining?: boolean;
  audienceSlugs: string[];
}

const INITIAL_USER: TransientUser = {
  firstName: "",
  lastName: "",
  email: "",
  audienceSlugs: [],
};

const EditOrganizationUser: React.FC<EditOrganizationUserProps> = ({
  setOpen,
  create,
  userId,
}) => {
  const {
    myOrganization: organization,
    currentUnitSlug: unitSlug,
    invalidateOrganizationUsersQuery,
  } = useContext(MyOrganizationContext);

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

  const formMethods = useForm({
    values: userData
      ? toTransientUser(userData)
      : {
          ...INITIAL_USER,
          unitSlug,
        },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty, dirtyFields },
  } = formMethods;

  const canAccessTraining = watch("canAccessTraining");

  const { mutate: save, isPending } = useMutation({
    mutationFn: (user: TransientUser) =>
      organization
        ? saveOrganizationUser(organization.id, toOrgUser(user)).then(
            async (updatedUser) => {
              if (dirtyFields.canAccessTraining) {
                if (user.canAccessTraining === true) {
                  return assignOrganizationUserToRoleGroup(
                    organization.id,
                    updatedUser.id,
                    { groupPath: TRAINING_PARTICIPANT_ROLE_GROUP_PATH }
                  ).then(() => updatedUser);
                } else if (user.id && user.canAccessTraining === false) {
                  // Only revoke if user already existed. New users won't be
                  // assigned to this role group yet anyway.
                  return revokeOrganizationUserToRoleGroup(
                    organization.id,
                    updatedUser.id,
                    { groupPath: TRAINING_PARTICIPANT_ROLE_GROUP_PATH }
                  ).then(() => updatedUser);
                }
              }

              return Promise.resolve(updatedUser);
            }
          )
        : Promise.reject(new Error("No organization")),
    onSuccess: () => {
      invalidateOrganizationUsersQuery();
      setOpen(false);
    },
  });

  const handleSave = (user: TransientUser) => {
    save(user);
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
        </SlideOverField>
        <SlideOverField name="firstName" label="First Name">
          <Input
            type={FieldType.TEXT}
            required
            {...register("firstName")}
            className="w-full"
          />
        </SlideOverField>
        <SlideOverField name="lastName" label="Last Name">
          <Input
            type={FieldType.TEXT}
            required
            {...register("lastName")}
            className="w-full"
          />
        </SlideOverField>
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
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationUser;

const toOrgUser = (user: TransientUser): Partial<OrganizationUser> => ({
  id: user.id,
  username: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  attributes: {
    audience: user.audienceSlugs,
    ...(user.unitSlug ? { unit: [user.unitSlug] } : {}),
  },
});

const toTransientUser = (
  orgUser: OrganizationUser,
  unitSlug?: string
): TransientUser => ({
  id: orgUser.id,
  firstName: orgUser.firstName,
  lastName: orgUser.lastName,
  email: orgUser.email,
  unitSlug: orgUser.attributes.unit?.at(0) ?? unitSlug,
  audienceSlugs: orgUser.attributes.audience ?? [],
  canAccessTraining: orgUser.groups?.includes(
    TRAINING_PARTICIPANT_ROLE_GROUP_PATH
  ),
});
