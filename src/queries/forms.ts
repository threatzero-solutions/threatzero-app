import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Field, FieldGroup, Form } from "../types/entities";
import { deleteOne, findMany, findOneOrFail, save } from "./utils";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";

export const getForm = (formId?: string) =>
  findOneOrFail<Form>("/forms/", formId);

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

export interface FilePreloadResult {
  key: string;
  url: string;
}

export interface FilePreloadResponse {
  fileResults: FilePreloadResult[];
}

export interface GetPresignedUploadUrlsResult {
  putUrl: string;
  getUrl: string;
  key: string;
  filename: string;
  fileId: string;
}
export const filePreload = async (
  getPresignedUploadUrlsUrl: string,
  files: File[]
): Promise<FilePreloadResult[]> =>
  axios
    .post<GetPresignedUploadUrlsResult[]>(getPresignedUploadUrlsUrl, {
      files: files.map((f) => ({
        filename: f.name,
        fileId: `${f.name}_${f.size}`,
        mimeType: f.type,
      })),
    })
    .then((res) => res.data)
    .then((data) =>
      Promise.all(
        data
          .map(
            (result) =>
              [
                result,
                files.find((f) => `${f.name}_${f.size}` === result.fileId),
              ] as const
          )
          .filter((v) => !!v[1])
          .map(async ([result, file]) => {
            return axios
              .create()
              .put(result.putUrl, file, {
                headers: {
                  "Content-Type": file!.type,
                },
              })
              .then(() => ({
                key: result.key,
                url: result.getUrl,
              }));
          })
      )
    );
