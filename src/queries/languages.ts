import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { DeepPartial } from "../types/core";
import { Language } from "../types/entities";
import { deleteOne, findMany, save } from "./utils";

export const getLanguages = (query?: ItemFilterQueryParams) =>
  findMany<Language>("/languages/", query);

export const saveLanguage = async (language: DeepPartial<Language>) =>
  save<Language>("/languages/", language);

export const deleteLanguage = (id: string | undefined) =>
  deleteOne("/languages/", id);
