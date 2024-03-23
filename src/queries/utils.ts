import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { Paginated } from "../types/entities";

export const findOneOrFail = <T>(path: string, id?: string) =>
  id
    ? axios
        .get<T>(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("ID must not be empty."));

export const findOne = <T>(path: string, id?: string) =>
  findOneOrFail<T>(path, id).catch((e) => {
    if (e instanceof AxiosError && e.response?.status === 404) {
      return null;
    }
    throw e;
  });

export const findManyRaw = <T>(
  path: string,
  query: ItemFilterQueryParams = {}
) =>
  axios
    .get<T>(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/`, {
      params: {
        ...query,
      },
    })
    .then((res) => res.data);

export const findMany = <T>(path: string, query: ItemFilterQueryParams = {}) =>
  findManyRaw<Paginated<T>>(path, query);

export const insertOne = async <T>(
  path: string,
  entity: Partial<T>,
  options: AxiosRequestConfig = {}
) => {
  return axios
    .post<T>(
      `${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/`,
      entity,
      options
    )
    .then((res) => res.data);
};

export const updateOne = async <T extends { id: string }>(
  path: string,
  entity: Partial<T>,
  options: AxiosRequestConfig = {}
) => {
  return axios
    .patch<T>(
      `${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${entity.id ?? ""}`,
      entity,
      options
    )
    .then((res) => res.data);
};

export const save = async <T extends { id: string }>(
  path: string,
  entity: Partial<T>,
  options: AxiosRequestConfig = {}
) =>
  entity.id
    ? updateOne(path, entity, options)
    : insertOne(path, entity, options);

export const deleteOne = (path: string, id?: string) =>
  id
    ? axios.delete(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${id}`)
    : Promise.reject(new Error("ID must not be empty."));
