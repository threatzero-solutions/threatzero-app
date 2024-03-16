import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Field, FieldGroup, Form, Paginated } from "../types/entities";

export const getForm = (formId?: string) =>
  formId
    ? axios
        .get<Form>(`${API_BASE_URL}/api/forms/${formId}`)
        .then((res) => res.data)
    : Promise.reject(new Error("Form ID must not be empty."));

export const getForms = (params: { [key: string]: any } = {}) =>
  axios
    .get<Paginated<Form>>(`${API_BASE_URL}/api/forms/`, {
      params: {
        ...params,
      },
    })
    .then((res) => res.data);

export const getFormsGroupedBySlug = () =>
  axios
    .get<Form[]>(`${API_BASE_URL}/api/forms/grouped-by-slug`)
    .then((res) => res.data);

// MUTATIONS

export const saveForm = async (form: Partial<Form>) => {
  if (!form.slug) {
    return Promise.reject(new Error("Form slug must not be empty."));
  }

  const method = form.id ? "patch" : "post";
  return axios[method]<Form>(
    `${API_BASE_URL}/api/forms/${form.id ? form.id : ""}`,
    form
  ).then((res) => res.data);
};

export const newDraftForm = async (formId?: string) =>
  formId
    ? axios
        .post<Form>(`${API_BASE_URL}/api/forms/${formId}/new-draft`)
        .then((res) => res.data)
    : Promise.reject(new Error("Form ID must not be empty."));

export const deleteForm = async (formId?: string) =>
  formId
    ? axios.delete(`${API_BASE_URL}/api/forms/${formId}`)
    : Promise.reject(new Error("Form ID must not be empty."));

export const saveFieldGroup = async (fieldGroup: Partial<FieldGroup>) => {
  const method = fieldGroup.id ? "patch" : "post";
  return axios[method]<FieldGroup>(
    `${API_BASE_URL}/api/forms/groups/${fieldGroup.id ?? ""}`,
    fieldGroup
  ).then((res) => res.data);
};

export const deleteFieldGroup = async (groupId?: string) =>
  groupId
    ? axios.delete(`${API_BASE_URL}/api/forms/groups/${groupId}`)
    : Promise.reject(new Error("Field Group ID must not be empty."));

export const saveField = async (field: Partial<Field>) => {
  const method = field.id ? "patch" : "post";
  return axios[method]<FieldGroup>(
    `${API_BASE_URL}/api/forms/fields/${field.id ?? ""}`,
    field
  ).then((res) => res.data);
};

export const deleteField = async (fieldId?: string) =>
  fieldId
    ? axios.delete(`${API_BASE_URL}/api/forms/fields/${fieldId}`)
    : Promise.reject(new Error("Field ID must not be empty."));

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
          .filter(([_, f]) => !!f)
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
