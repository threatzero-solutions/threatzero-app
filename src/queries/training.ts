import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import {
  Audience,
  ItemCompletion,
  Organization,
  TrainingCourse,
  TrainingItem,
  TrainingSection,
  Video,
  VideoEvent,
} from "../types/entities";
import {
  deleteOne,
  download,
  findMany,
  findManyRaw,
  findOne,
  findOneById,
  putOne,
  save,
  updateOne,
} from "./utils";

export const getMyCourseEnrollments = () =>
  findOne<Organization>("/organizations/organizations/mine/").then(
    (organization) => organization?.enrollments ?? []
  );

export const getTrainingAudiences = (options: ItemFilterQueryParams = {}) =>
  findMany<Audience>("/training/audiences/", options);

export const getTrainingCourses = (options: ItemFilterQueryParams = {}) =>
  findMany<TrainingCourse>("/training/courses/", options);

export const getTrainingCourse = (id?: string) =>
  findOneById<TrainingCourse>("/training/courses/", id);

export const getTrainingSection = (id?: string) =>
  findOneById<TrainingSection>("/training/sections/", id);

export const getTrainingItems = (options: ItemFilterQueryParams = {}) =>
  findMany<TrainingItem>("/training/items/", options);

export const getTrainingItem = (id?: string, watchId?: string | null) =>
  findOneById<TrainingItem>(`/training/items/${watchId ? "watch/" : ""}`, id, {
    params: { watch_id: watchId },
  });

export const getPresignedPutUrl = (key: string) =>
  axios
    .post<{ signedUrl: string }>(
      `${API_BASE_URL}/training/items/get-presigned-put-url/`,
      {
        key,
      }
    )
    .then((r) => r.data.signedUrl);

export const getMyItemCompletion = (
  itemId: string,
  enrollmentId: string | undefined,
  watchId?: string | null
) =>
  findMany<ItemCompletion>(`/training/items/my-completions/`, {
    watch_id: watchId,
    ["item.id"]: itemId,
    ["enrollment.id"]: enrollmentId,
  }).then((r) => r.results[0] ?? null);

export const getMyItemCompletions = (
  query: ItemFilterQueryParams,
  watchId?: string | null
) =>
  findMany<ItemCompletion>(`/training/items/my-completions/`, {
    ...query,
    watch_id: watchId,
  });

export const getItemCompletions = (query: ItemFilterQueryParams) =>
  findMany<ItemCompletion>("/training/items/completions/", query);

export const getItemCompletionsSummary = (query: ItemFilterQueryParams) =>
  findManyRaw<{
    totalComplete: number;
    totalIncomplete: number;
  }>("/training/items/completions/summary/", query);

export const getItemCompletionsCsv = (query: ItemFilterQueryParams) =>
  download("/training/items/completions/csv/", query);

// ------- MUTATIONS ---------

export const saveTrainingCourse = (course: Partial<TrainingCourse>) =>
  save<TrainingCourse>("/training/courses/", course);

export const deleteTrainingCourse = (id?: string) =>
  deleteOne("/training/courses/", id);

export const saveTrainingSection = (section: Partial<TrainingSection>) =>
  save<TrainingSection>("/training/sections/", section);

export const deleteTrainingSection = async (id?: string) =>
  deleteOne("/training/sections/", id);

export const swapTrainingSectionOrders = async (
  sectionA: Partial<TrainingSection>,
  sectionB: Partial<TrainingSection>
) =>
  Promise.all([
    updateOne<TrainingSection>("/training/sections/", {
      id: sectionA.id,
      order: sectionB.order,
    }),
    updateOne<TrainingSection>("/training/sections/", {
      id: sectionB.id,
      order: sectionA.order,
    }),
  ]);

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

export const emitVideoEvent = async (
  event: VideoEvent,
  watchId?: string | null
) =>
  axios
    .post(
      `${API_BASE_URL}/media/video/events/${
        watchId ? "?watch_id=" + watchId : ""
      }`,
      event
    )
    .then((res) => res.data);

export const updateOrCreateItemCompletion = async (
  input: {
    itemId: string;
    sectionId?: string;
    enrollmentId: string | undefined;
    url: string;
    progress: number;
    completed: boolean;
  },
  watchId?: string | null
) =>
  putOne<ItemCompletion>(
    "/training/items/my-completions/",
    {
      item: {
        id: input.itemId,
      },
      section: input.sectionId ? { id: input.sectionId } : undefined,
      enrollment: { id: input.enrollmentId },
      url: input.url,
      progress: input.progress,
      completed: input.completed,
    },
    {
      params: { watch_id: watchId },
    }
  );
