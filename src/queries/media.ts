import {
  ResourceItem,
  ResourceItemCategory,
  ResourceType,
} from "../types/entities";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { deleteOne, findMany, findOneById, save } from "./utils";

export interface GetResourceItemOptions extends ItemFilterQueryParams {
  category?: ResourceItemCategory;
  type?: ResourceType;
}

export const getResourceItems = (query?: GetResourceItemOptions) =>
  findMany<ResourceItem>("/resources/", query);

export const getResourceItem = (id: string) =>
  findOneById<ResourceItem>("/resources/", id);

// MUTATIONS

export const saveResourceItem = async (resource: Partial<ResourceItem>) =>
  save<ResourceItem>("/resources/", resource);

export const deleteResourceItem = (id: string | undefined) =>
  deleteOne("/resources/", id);
