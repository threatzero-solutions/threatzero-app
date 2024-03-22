import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
  Audience,
  Paginated,
  TrainingCourse,
  TrainingItem,
  TrainingSection,
  UserTrainingCheckpoint,
  Video,
  VideoEvent,
} from "../types/entities";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";

export const getTrainingAudiences = () =>
  axios
    .get<Paginated<Audience>>(`${API_BASE_URL}/api/training/audiences/`, {
      params: {
        limit: 50,
      },
    })
    .then((res) => res.data);

export const getTrainingCourses = () =>
  axios
    .get<Paginated<TrainingCourse>>(`${API_BASE_URL}/api/training/courses/`)
    .then((res) => res.data);

export const getTrainingCourse = (id?: string) =>
  id
    ? axios
        .get<TrainingCourse>(`${API_BASE_URL}/api/training/courses/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training course ID must not be empty."));

export const getTrainingSection = (id?: string) =>
  id
    ? axios
        .get<TrainingSection>(`${API_BASE_URL}/api/training/sections/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training section ID must not be empty."));

export const getTrainingItems = (options: ItemFilterQueryParams = {}) =>
  axios
    .get<Paginated<TrainingItem>>(`${API_BASE_URL}/api/training/items/`, {
      params: {
        ...options,
      },
    })
    .then((res) => res.data);

export const getTrainingItem = (id?: string) =>
  id
    ? axios
        .get<Video>(`${API_BASE_URL}/api/training/items/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training item ID must not be empty."));

export const getPresignedPutUrl = (key: string) =>
  axios
    .post<{ signedUrl: string }>(
      `${API_BASE_URL}/api/training/items/get-presigned-put-url/`,
      {
        key,
      }
    )
    .then((r) => r.data.signedUrl);

// ------- MUTATIONS ---------

export const saveTrainingCourse = async (course: Partial<TrainingCourse>) => {
  const method = course.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/training/courses/${course.id ?? ""}`,
    course
  ).then((res) => res.data);
};

export const deleteTrainingCourse = async (id?: string) =>
  id
    ? axios
        .delete(`${API_BASE_URL}/api/training/courses/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training course ID must not be empty."));

export const saveTrainingSection = async (
  section?: Partial<TrainingSection>
) => {
  if (!section) {
    return Promise.reject(
      new Error("Training course ID and section must not be empty.")
    );
  }

  const method = section.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/training/sections/${section.id ?? ""}`,
    section
  ).then((res) => res.data);
};

export const deleteTrainingSection = async (sectionId?: string) =>
  sectionId
    ? axios
        .delete(`${API_BASE_URL}/api/training/sections/${sectionId}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training section ID must not be empty."));

export const saveTrainingItem = async (item: Partial<TrainingItem & Video>) => {
  const method = item.id ? "patch" : "post";

  const itemToSave = { ...item };

  const ignoreFields: Array<keyof Video> = ["thumbnailUrl", "mediaUrls"];

  for (const key of Object.keys(itemToSave)) {
    if (ignoreFields.includes(key as keyof Video)) {
      Reflect.deleteProperty(itemToSave, key);
    }
  }

  // TODO: Add support for other items.
  itemToSave.type = "Video";

  return axios[method](
    `${API_BASE_URL}/api/training/items/${itemToSave.id ?? ""}`,
    itemToSave
  ).then((res) => res.data);
};

export type EncodingJobStatus =
  | "SUBMITTED"
  | "PROGRESSING"
  | "COMPLETE"
  | "CANCELED"
  | "ERROR";

export interface EncodingJobResponse {
  status: EncodingJobStatus | null;
  item: Video;
  error: string | null;
}
export const toggleABRForVideo = async (enable: boolean, itemId: string) =>
  axios
    .post<EncodingJobResponse>(
      `${API_BASE_URL}/api/training/items/${itemId}/toggle-abr`,
      { enable }
    )
    .then((res) => res.data);

export const getEncodingStatusForVideo = async (itemId: string) =>
  axios
    .get<EncodingJobResponse>(
      `${API_BASE_URL}/api/training/items/${itemId}/encoding-status`
    )
    .then((res) => res.data);

export const deleteTrainingItem = async (id?: string) =>
  id
    ? axios
        .delete(`${API_BASE_URL}/api/training/items/${id}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Training item ID must not be empty."));

export const setUserTrainingCheckpoints = async (
  checkpoints: Partial<UserTrainingCheckpoint>[],
  itemId?: string,
  sectionId?: string
) => {
  if (!checkpoints.length) {
    return Promise.reject(new Error("No checkpoints provided."));
  }
  if (!itemId) {
    return Promise.reject(new Error("Training item ID must not be empty."));
  }
  if (!sectionId) {
    return Promise.reject(new Error("Training section ID must not be empty."));
  }
  return axios
    .patch(
      `${API_BASE_URL}/api/training/items/${itemId}/checkpoint/`,
      checkpoints,
      {
        params: {
          sectionId,
        },
      }
    )
    .then((res) => res.data);
};

export const saveTrainingAudience = async (audience: Partial<Audience>) => {
  const method = audience.id ? "patch" : "post";
  return axios[method](
    `${API_BASE_URL}/api/training/audiences/${audience.id ?? ""}`,
    audience
  ).then((res) => res.data);
};

export const deleteTrainingAudience = async (id?: string) =>
  id
    ? axios.delete(`${API_BASE_URL}/api/training/audiences/${id}`)
    : Promise.reject(new Error("Audience ID must not be empty."));

export const emitVideoEvent = async (event: VideoEvent) =>
  axios
    .post(`${API_BASE_URL}/api/media/video/events/`, event)
    .then((res) => res.data);
