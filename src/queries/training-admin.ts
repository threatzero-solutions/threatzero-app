import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
  MarkTrainingCompleteDto,
  ResendTrainingLinksDto,
  SendTrainingLinksDto,
  SendTrainingReminderDto,
} from "../types/api";
import { TrainingToken } from "../types/entities";
import { download, findMany } from "./utils";
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

export const sendTrainingReminder = (body: SendTrainingReminderDto) =>
  axios
    .post(`${API_BASE_URL}/training-admin/reminders/`, body)
    .then((res) => res.data);

export const markTrainingComplete = (body: MarkTrainingCompleteDto) =>
  axios
    .post(`${API_BASE_URL}/training-admin/completions/mark-complete`, body)
    .then((res) => res.data);

export const getTrainingInvites = (query?: ItemFilterQueryParams) =>
  findMany<TrainingToken>("/training-admin/invites/", query);

export const getTrainingInvitesCsv = (
  trainingUrlTemplate: string,
  query?: ItemFilterQueryParams,
  options?: AxiosRequestConfig
) =>
  download(
    "/training-admin/invites/csv/",
    {
      ...query,
      trainingUrlTemplate,
    },
    options
  );
