import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { Field, FieldGroup, Form } from "../types/entities";
import { deleteOne, findMany, findOneByIdOrFail, save } from "./utils";

export const getForm = (formId?: string) =>
  findOneByIdOrFail<Form>("/forms/", formId);

export const getForms = (query: ItemFilterQueryParams = {}) =>
  findMany<Form>("/forms/", query);

export const getFormsGroupedBySlug = () =>
  axios
    .get<Form[]>(`${API_BASE_URL}/forms/grouped-by-slug`)
    .then((res) => res.data);

// MUTATIONS

export const saveForm = async (form: Partial<Form>) => {
  if (!form.slug) {
    return Promise.reject(new Error("Form slug must not be empty."));
  }

  return save<Form>("/forms/", form);
};

export const newDraftForm = async ({
  formId,
  languageId,
}: {
  formId?: string;
  languageId?: string;
}) =>
  formId
    ? axios
        .post<Form>(
          `${API_BASE_URL}/forms/${formId}/new-draft?languageId=${languageId}`,
          {}
        )
        .then((res) => res.data)
    : Promise.reject(new Error("Form ID must not be empty."));

export const deleteForm = (formId?: string) => deleteOne("/forms/", formId);

export const saveFieldGroup = (fieldGroup: Partial<FieldGroup>) =>
  save<FieldGroup>("/forms/groups/", fieldGroup);

export const deleteFieldGroup = (groupId?: string) =>
  deleteOne("/forms/groups/", groupId);

export const saveField = (field: Partial<Field>) =>
  save<Field>("/forms/fields/", field);

export const deleteField = (fieldId?: string) =>
  deleteOne("/forms/fields/", fieldId);
