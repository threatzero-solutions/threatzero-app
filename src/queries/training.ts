import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
  Audience,
  TrainingCourse,
  TrainingItem,
  TrainingSection,
  Video,
  VideoEvent,
} from "../types/entities";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { deleteOne, findMany, findOne, save } from "./utils";

export const getTrainingAudiences = (options: ItemFilterQueryParams = {}) =>
  findMany<Audience>("/training/audiences/", options);

export const getTrainingCourses = (options: ItemFilterQueryParams = {}) =>
  findMany<TrainingCourse>("/training/courses/", options);

export const getTrainingCourse = (id?: string) =>
  findOne<TrainingCourse>("/training/courses/", id);

export const getTrainingSection = (id?: string) =>
  findOne<TrainingSection>("/training/sections/", id);

export const getTrainingItems = (options: ItemFilterQueryParams = {}) =>
  findMany<TrainingItem>("/training/items/", options);

export const getTrainingItem = (id?: string) =>
  findOne<TrainingItem>("/training/items/", id);

export const getPresignedPutUrl = (key: string) =>
  axios
    .post<{ signedUrl: string }>(
      `${API_BASE_URL}/training/items/get-presigned-put-url/`,
      {
        key,
      }
    )
    .then((r) => r.data.signedUrl);

// ------- MUTATIONS ---------

export const saveTrainingCourse = (course: Partial<TrainingCourse>) =>
  save<TrainingCourse>("/training/courses/", course);

export const deleteTrainingCourse = (id?: string) =>
  deleteOne("/training/courses/", id);

export const saveTrainingSection = (section: Partial<TrainingSection>) =>
  save<TrainingSection>("/training/sections/", section);

export const deleteTrainingSection = async (id?: string) =>
  deleteOne("/training/sections/", id);

export const saveTrainingItem = async (item: Partial<TrainingItem & Video>) => {
  // TODO: Add support for other items.
  const type = "Video";

  item = {
    ...item,
    type,
  };

  return save<Video>("/training/items/", item);
};

export const deleteTrainingItem = (id?: string) =>
  deleteOne("/training/items/", id);

export const saveTrainingAudience = (audience: Partial<Audience>) =>
  save<Audience>("/training/audiences/", audience);

export const deleteTrainingAudience = (id?: string) =>
  deleteOne("/training/audiences/", id);

export const emitVideoEvent = async (event: VideoEvent) =>
  axios
    .post(`${API_BASE_URL}/media/video/events/`, event)
    .then((res) => res.data);
