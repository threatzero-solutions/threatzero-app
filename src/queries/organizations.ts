import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
  Unit,
  Organization,
  Location,
  LmsTrainingToken,
  LmsTrainingTokenValue,
} from "../types/entities";
import {
  buildUrl,
  deleteOne,
  download,
  findMany,
  findManyRaw,
  findOne,
  findOneById,
  findOneByIdOrFail,
  findOneOrFail,
  insertOne,
  putOne,
  save,
  updateOne,
} from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { DeepPartial } from "../types/core";
import {
  IsUniqueResponse,
  KeycloakGroupDto,
  OrganizationIdpDto,
  OrganizationUser,
} from "../types/api";
import { ScormVersion } from "../types/training";

export const getOrganizations = (query?: ItemFilterQueryParams) =>
  findMany<Organization>("/organizations/organizations/", query);

export const getOrganization = (id?: string) =>
  findOneByIdOrFail<Organization>("/organizations/organizations/", id);

export const getMyOrganization = () =>
  findOneOrFail<Organization>("/organizations/organizations/mine/");

export const getOrganizationBySlug = (slug?: string) =>
  findOneByIdOrFail<Organization>("/organizations/organizations/slug/", slug);

export const isOrganizationSlugUnique = (slug: string) =>
  findOne<IsUniqueResponse>("/organizations/organizations/slug-unique/", {
    params: {
      slug,
    },
  });

export const isIdpSlugUnique = (slug: string) =>
  findOne<IsUniqueResponse>("/organizations/organizations/idp-slug-unique/", {
    params: {
      slug,
    },
  });

export const getCourseEnrollments = (id?: Organization["id"]) =>
  findOneById<Organization>("/organizations/organizations/", id).then(
    (organization) => organization?.enrollments ?? []
  );

export const getOrganizationLmsTokens = (
  id: Organization["id"],
  query?: ItemFilterQueryParams
) =>
  findMany<LmsTrainingToken>(
    `/organizations/organizations/${id}/lms-tokens/`,
    query
  );

export const getLmsScormPackage = (
  id: Organization["id"],
  key: string,
  version?: ScormVersion
) =>
  download(`/organizations/organizations/${id}/lms-tokens/scorm`, {
    key,
    version,
  });

export const getOrganizationUsers = (
  id: Organization["id"] | undefined,
  query?: ItemFilterQueryParams
) =>
  findMany<OrganizationUser>(
    `/organizations/organizations/${id}/users/`,
    query
  );

export const getOrganizationIdp = (id: Organization["id"], slug: string) =>
  findOneByIdOrFail<OrganizationIdpDto>(
    `/organizations/organizations/${id}/idps/`,
    slug
  );

export const getOrganizationIdpRoleGroups = (id: Organization["id"]) =>
  findManyRaw<KeycloakGroupDto[]>(
    `/organizations/organizations/${id}/idps/role-groups/`
  );

export const getUnits = (query?: ItemFilterQueryParams) =>
  findMany<Unit>("/organizations/units/", query);

export const getUnit = (id?: Unit["id"]) =>
  findOneByIdOrFail<Unit>("/organizations/units/", id);

export const getUnitBySlug = (slug?: string) =>
  getUnits({ slug }).then((res) => {
    if (res.results.length) return res.results[0];
    throw new Error('Unit not found by slug "' + slug + '"');
  });

export const isUnitSlugUnique = (organizationId: string, slug: string) =>
  findOne<IsUniqueResponse>("/organizations/units/slug-unique/", {
    params: { slug, organizationId },
  });

export const getLocations = (query?: ItemFilterQueryParams) =>
  findMany<Location>("/organizations/locations/", query);

export const getLocation = (id?: Location["id"]) =>
  findOneByIdOrFail<Location>("/organizations/locations/", id);

export const generateQrCode = async (locationId: string) => {
  const url = `${API_BASE_URL}/organizations/locations/${locationId}/sos-qr-code/`;
  return axios
    .get(url, {
      responseType: "blob",
    })
    .then((res) => ({ locationId, data: res.data }));
};

// ------------- MUTATIONS -------------

export const saveOrganization = (organization: DeepPartial<Organization>) =>
  save<Organization>("/organizations/organizations/", organization);

export const deleteOrganization = (id: string | undefined) =>
  deleteOne("/organizations/organizations/", id);

export const createOrganizationLmsToken = (
  id: Organization["id"],
  createLmsTokenValue: DeepPartial<LmsTrainingTokenValue>,
  expiresOn?: Date
) =>
  insertOne(
    `/organizations/organizations/${id}/lms-tokens/`,
    createLmsTokenValue,
    { params: { expiresOn } }
  );

export const setOrganizationLmsTokenExpirations = (
  id: Organization["id"],
  query: ItemFilterQueryParams,
  expiration: Date | null
) =>
  updateOne<{ id: never; expiration: Date | null }>(
    `/organizations/organizations/${id}/lms-tokens/expiration`,
    {
      expiration,
    },
    {
      params: query,
    }
  );

export type ImportOrganizationIdpMetadataPayload =
  | {
      url: string;
    }
  | FormData;

export const importOrganizationIdpMetadata = <
  T = ImportOrganizationIdpMetadataPayload
>(
  id: string,
  protocol: string,
  payload: T
) =>
  insertOne<T, Record<string, string>>(
    `/organizations/organizations/${id}/idps/load-imported-config/${protocol}/`,
    payload
  );

export const saveOrganizationUser = (
  id: Organization["id"],
  user: DeepPartial<OrganizationUser>
) => save<OrganizationUser>(`/organizations/organizations/${id}/users/`, user);

export const assignOrganizationUserToRoleGroup = (
  id: Organization["id"],
  userId: string,
  groupOptions: {
    groupId?: string;
    groupPath?: string;
  }
) =>
  axios.post(
    buildUrl(
      `/organizations/organizations/${id}/users/${userId}/assign-role-group/`
    ),
    null,
    {
      params: groupOptions,
    }
  );

export const revokeOrganizationUserToRoleGroup = (
  id: Organization["id"],
  userId: string,
  groupOptions: {
    groupId?: string;
    groupPath?: string;
  }
) =>
  axios.post(
    buildUrl(
      `/organizations/organizations/${id}/users/${userId}/revoke-role-group/`
    ),
    null,
    {
      params: groupOptions,
    }
  );

export const createOrganizationIdp = (
  id: Organization["id"],
  createOrganizationIdpDto: OrganizationIdpDto
) =>
  insertOne(
    `/organizations/organizations/${id}/idps/`,
    createOrganizationIdpDto
  );

export const updateOrganizationIdp = (
  id: string,
  slug: string,
  updateOrganizationIdpDto: OrganizationIdpDto
) =>
  putOne(
    `/organizations/organizations/${id}/idps/${slug}/`,
    updateOrganizationIdpDto
  );

export const deleteOrganizationIdp = (id: Organization["id"], slug: string) =>
  deleteOne(`/organizations/organizations/${id}/idps/`, slug);

export const saveUnit = (unit: DeepPartial<Unit>) =>
  save<Unit>("/organizations/units/", unit);

export const deleteUnit = (id: string | undefined) =>
  deleteOne("/organizations/units/", id);

export const saveLocation = async (location: DeepPartial<Location>) =>
  save<Location>("/organizations/locations/", location);

export const deleteLocation = (id: string | undefined) =>
  deleteOne("/organizations/locations/", id);
