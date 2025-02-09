import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from "../constants/organizations";
import { OrganizationUser } from "../types/api";

export const canAccessTraining = (user: OrganizationUser) =>
  user.groups?.includes(TRAINING_PARTICIPANT_ROLE_GROUP_PATH);
