import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Unit, Organization, Location } from "../types/entities";
import { deleteOne, findMany, save } from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";

export const getOrganizations = (query?: ItemFilterQueryParams) =>
  findMany<Organization>("/organizations/organizations/", query);

export const getUnits = (query?: ItemFilterQueryParams) =>
  findMany<Unit>("/organizations/units/", query);

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

export const saveOrganization = (organization: Partial<Organization>) =>
  save<Organization>("/organizations/organizations/", organization);

export const deleteOrganization = (id: string | undefined) =>
  deleteOne("/organizations/organizations/", id);

export const saveUnit = (unit: Partial<Unit>) =>
  save<Unit>("/organizations/units/", unit);

export const deleteUnit = (id: string | undefined) =>
  deleteOne("/organizations/units/", id);

export const saveLocation = async (location: Partial<Location>) =>
  save<Location>("/organizations/locations/", location);

export const deleteLocation = (id: string | undefined) =>
  deleteOne("/organizations/locations/", id);
