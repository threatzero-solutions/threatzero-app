import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Unit, Organization, Location } from "../types/entities";
import {
  deleteOne,
  findMany,
  findManyRaw,
  findOneOrFail,
  insertOne,
  putOne,
  save,
} from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { DeepPartial } from "../types/core";
import { OrganizationIdpDto, OrganizationUser } from "../types/api";

export const getOrganizations = (query?: ItemFilterQueryParams) =>
  findMany<Organization>("/organizations/organizations/", query);

export const getOrganization = (id?: string) =>
  findOneOrFail<Organization>("/organizations/organizations/", id);

export const getOrganizationBySlug = (slug?: string) =>
  findOneOrFail<Organization>("/organizations/organizations/slug/", slug);

export const getOrganizationUsers = (
  id: Organization["id"] | undefined,
  query?: ItemFilterQueryParams
) =>
  findMany<OrganizationUser>(
    `/organizations/organizations/${id}/users/`,
    query
  );

export const getOrganizationIdp = (id: Organization["id"], slug: string) =>
  findOneOrFail<OrganizationIdpDto>(
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
    .then((res) => res.data);
};

// ------------- MUTATIONS -------------

export const saveOrganization = (organization: DeepPartial<Organization>) =>
  save<Organization>("/organizations/organizations/", organization);

export const deleteOrganization = (id: string | undefined) =>
  deleteOne("/organizations/organizations/", id);

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
