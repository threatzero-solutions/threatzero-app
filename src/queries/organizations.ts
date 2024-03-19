import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Unit, Organization, Location, Paginated } from "../types/entities";
import { PageOptions } from "../components/layouts/Paginator";

export const getOrganizations = (options?: Partial<PageOptions>) =>
  axios
    .get<Paginated<Organization>>(
      `${API_BASE_URL}/api/organizations/organizations/`,
      {
        params: {
          limit: options?.limit ?? 10,
          offset: options?.offset ?? 0,
          search: options?.search,
        },
      }
    )
    .then((res) => res.data);

export const getUnits = (options?: Partial<PageOptions>) =>
  axios
    .get<Paginated<Unit>>(`${API_BASE_URL}/api/organizations/units/`, {
      params: {
        limit: options?.limit ?? 10,
        offset: options?.offset ?? 0,
        search: options?.search,
      },
    })
    .then((res) => res.data);

export const getLocations = (options?: Partial<PageOptions>) =>
  axios
    .get<Paginated<Location>>(`${API_BASE_URL}/api/organizations/locations/`, {
      params: {
        limit: options?.limit ?? 10,
        offset: options?.offset ?? 0,
        search: options?.search,
      },
    })
    .then((res) => res.data);

export const generateQrCode = async (locationId: string) => {
  const url = `${API_BASE_URL}/api/organizations/locations/${locationId}/sos-qr-code/`;
  return axios
    .get(url, {
      responseType: "blob",
    })
    .then((res) => res.data);
};

// ------------- MUTATIONS -------------

export const saveOrganization = async (organization: Partial<Organization>) => {
  const method = organization.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/organizations/organizations/${organization.id ?? ""}`,
    organization
  ).then((res) => res.data);
};

export const deleteOrganization = (id: string | undefined) =>
  id
    ? axios.delete(`${API_BASE_URL}/api/organizations/organizations/${id}`)
    : Promise.reject(new Error("Organization ID must not be empty."));

export const saveUnit = async (unit: Partial<Unit>) => {
  const method = unit.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/organizations/units/${unit.id ?? ""}`,
    unit
  ).then((res) => res.data);
};

export const deleteUnit = (id: string | undefined) =>
  id
    ? axios.delete(`${API_BASE_URL}/api/organizations/units/${id}`)
    : Promise.reject(new Error("Unit ID must not be empty."));

export const saveLocation = async (location: Partial<Location>) => {
  const method = location.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/organizations/locations/${location.id ?? ""}`,
    location
  ).then((res) => res.data);
};

export const deleteLocation = (id: string | undefined) =>
  id
    ? axios.delete(`${API_BASE_URL}/api/organizations/locations/${id}`)
    : Promise.reject(new Error("Location ID must not be empty."));
