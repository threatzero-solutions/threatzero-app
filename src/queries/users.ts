import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { TrainingToken } from "../types/entities";
import { findMany, save } from "./utils";

export const getTrainingTokens = (query?: ItemFilterQueryParams) =>
  findMany<TrainingToken>("/users/training-token/", query);

export const createTrainingToken = (value: object) =>
  save("/users/training-token/", value);
