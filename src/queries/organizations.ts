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
  deleteOne,
  download,
  findMany,
  findManyRaw,
  findOneByIdOrFail,
  insertOne,
  putOne,
  save,
  updateOne,
} from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { DeepPartial } from "../types/core";
import { OrganizationIdpDto, OrganizationUser } from "../types/api";

export const getOrganizations = (query?: ItemFilterQueryParams) =>
  findMany<Organization>("/organizations/organizations/", query);

export const getOrganization = (id?: string) =>
  findOneByIdOrFail<Organization>("/organizations/organizations/", id);

export const getOrganizationBySlug = (slug?: string) =>
  findOneByIdOrFail<Organization>("/organizations/organizations/slug/", slug);

export const getOrganizationLmsTokens = (
  id: Organization["id"],
  query?: ItemFilterQueryParams
) =>
  findMany<LmsTrainingToken>(
    `/organizations/organizations/${id}/lms-tokens/`,
    query
  );

export const getLmsScormPackage = (id: Organization["id"], key: string) =>
  download(`/organizations/organizations/${id}/lms-tokens/scorm`, { key });

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
  findManyRaw<string[]>(`/organizations/organizations/${id}/idps/role-groups/`);

export const getUnits = (query?: ItemFilterQueryParams) =>
  findMany<Unit>("/organizations/units/", query);

export const getUnitBySlug = (slug?: string) =>
  getUnits({ slug }).then((res) => res.results[0]);

export const getLocations = (query?: ItemFilterQueryParams) =>
  findMany<Location>("/organizations/locations/", query);

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
