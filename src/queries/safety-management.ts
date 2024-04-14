import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { POCFile } from "../types/entities";
import { findMany } from "./utils";

export const getPOCFiles = (query: ItemFilterQueryParams = {}) =>
  findMany<POCFile>("/safety-management/poc-files/", query);
