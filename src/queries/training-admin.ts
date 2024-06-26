import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { SendTrainingLinksDto } from "../types/api";

export const sendTrainingLinks = (
  body: SendTrainingLinksDto,
  options?: AxiosRequestConfig
) =>
  axios
    .post(`${API_BASE_URL}/training-admin/send-links`, body, {
      ...options,
    })
    .then((res) => res.data);

export const getWatchStats = (
  courseId: string,
  organizationSlug?: string,
  unitSlugs?: string[],
  options?: AxiosRequestConfig
) =>
  axios
    .get(`${API_BASE_URL}/training-admin/watch-stats/csv/`, {
      params: {
        courseId,
        organizationSlug,
        unitSlug: unitSlugs,
      },
      responseType: "arraybuffer",
      ...options,
    })
    .then((res) => res.data);
