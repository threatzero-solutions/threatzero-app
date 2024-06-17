import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { OpaqueToken } from "../types/entities";
import { findMany } from "./utils";

export const getTrainingTokens = (query?: ItemFilterQueryParams) =>
  findMany<OpaqueToken>("/users/training-token/", query);
