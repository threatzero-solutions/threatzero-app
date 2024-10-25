import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { Paginated } from "../types/entities";
import { DeepPartial } from "../types/core";

export const nullFrom404 = (e: unknown) => {
  if (e instanceof AxiosError && e.response?.status === 404) {
    return null;
  }
  throw e;
};

export const findOneOrFail = <T>(path: string, options?: AxiosRequestConfig) =>
  axios
    .get<T>(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}`, {
      ...options,
    })
    .then((res) => res.data);

export const findOneByIdOrFail = <T>(
  path: string,
  id?: string,
  options?: AxiosRequestConfig
) =>
  id
    ? axios
        .get<T>(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${id ?? ""}`, {
          ...options,
        })
        .then((res) => res.data)
    : Promise.reject(new Error("ID must not be empty."));

export const findOne = <T>(path: string, options?: AxiosRequestConfig) =>
  findOneOrFail<T>(path, options).catch(nullFrom404);

export const findOneById = <T>(
  path: string,
  id?: string,
  options?: AxiosRequestConfig
) => findOneByIdOrFail<T>(path, id, options).catch(nullFrom404);

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

export const insertOne = <T, R = T>(
  path: string,
  entity: DeepPartial<T>,
  options: AxiosRequestConfig = {}
) =>
  axios
    .post<R>(
      `${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/`,
      entity,
      options
    )
    .then((res) => res.data);

export const putOne = <T>(
  path: string,
  entity: DeepPartial<T>,
  options: AxiosRequestConfig = {}
) =>
  axios
    .put<T>(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/`, entity, options)
    .then((res) => res.data);

export const updateOne = <T extends { id: string }>(
  path: string,
  entity: DeepPartial<T>,
  options: AxiosRequestConfig = {}
) =>
  axios
    .patch<T>(
      `${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${entity.id ?? ""}`,
      entity,
      options
    )
    .then((res) => res.data);

export const save = async <T extends { id: string }>(
  path: string,
  entity: DeepPartial<T>,
  options: AxiosRequestConfig = {}
) =>
  entity.id
    ? updateOne(path, entity, options)
    : insertOne(path, entity, options);

export const deleteOne = (path: string, id?: string) =>
  id
    ? axios.delete(`${API_BASE_URL}/${path.replace(/^\/|\/$/g, "")}/${id}`)
    : Promise.reject(new Error("ID must not be empty."));
