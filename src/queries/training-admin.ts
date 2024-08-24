import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ResendTrainingLinksDto, SendTrainingLinksDto } from "../types/api";
import { TrainingToken, WatchStat } from "../types/entities";
import { findMany } from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";

export const sendTrainingLinks = (
  body: SendTrainingLinksDto,
  options?: AxiosRequestConfig
) =>
  axios
    .post(`${API_BASE_URL}/training-admin/invites/`, body, {
      ...options,
    })
    .then((res) => res.data);

export const resendTrainingLinks = (
  body: ResendTrainingLinksDto,
  options?: AxiosRequestConfig
) =>
  axios
    .post(`${API_BASE_URL}/training-admin/invites/resend/`, body, {
      ...options,
    })
    .then((res) => res.data);

export const getTrainingInvites = (query?: ItemFilterQueryParams) =>
  findMany<TrainingToken>("/training-admin/invites/", query);

export const getTrainingInvitesCsv = (
  trainingUrlTemplate: string,
  query?: ItemFilterQueryParams,
  options?: AxiosRequestConfig
) =>
  axios
    .get(`${API_BASE_URL}/training-admin/invites/csv/`, {
      params: {
        ...query,
        trainingUrlTemplate,
      },
      responseType: "arraybuffer",
      ...options,
    })
    .then((res) => res.data);

export const findWatchStats = (query?: ItemFilterQueryParams) =>
  findMany<WatchStat>("/training-admin/watch-stats/", query);

export const getWatchStatsCsv = (
  query?: ItemFilterQueryParams,
  options: AxiosRequestConfig = {}
) =>
  axios
    .get(`${API_BASE_URL}/training-admin/watch-stats/csv/`, {
      params: {
        ...query,
      },
      responseType: "arraybuffer",
      ...options,
    })
    .then((res) => res.data);
