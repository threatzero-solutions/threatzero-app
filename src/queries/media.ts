import axios from "axios";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import {
  ResourceItem,
  ResourceItemCategory,
  ResourceType,
} from "../types/entities";
import { deleteOne, findMany, findOneById, save } from "./utils";

export interface GetResourceItemOptions extends ItemFilterQueryParams {
  category?: ResourceItemCategory;
  type?: ResourceType;
}

export const getResourceItems = (query?: GetResourceItemOptions) =>
  findMany<ResourceItem>("/resources/", query);

export const getResourceItem = (id: string) =>
  findOneById<ResourceItem>("/resources/", id);

export interface FilePreloadResult {
  key: string;
  filename: string;
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

export const prepareFileUploads = (
  getPresignedUploadUrlsUrl: string,
  files: File[]
) =>
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
      data
        .map(
          (result) =>
            [
              result,
              files.find((f) => `${f.name}_${f.size}` === result.fileId),
            ] as const
        )
        .filter((v): v is [GetPresignedUploadUrlsResult, File] => !!v[1])
    );

export const uploadFile = (url: string, file: File) =>
  axios.create().put(url, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

export const filePreload = async (
  getPresignedUploadUrlsUrl: string,
  files: File[]
): Promise<FilePreloadResult[]> =>
  prepareFileUploads(getPresignedUploadUrlsUrl, files).then((data) =>
    Promise.all(
      data.map(async ([result, file]) => {
        return uploadFile(result.putUrl, file).then(() => ({
          key: result.key,
          filename: result.filename,
          url: result.getUrl,
        }));
      })
    )
  );

// MUTATIONS

export const saveResourceItem = async (resource: Partial<ResourceItem>) =>
  save<ResourceItem>("/resources/", resource);

export const deleteResourceItem = (id: string | undefined) =>
  deleteOne("/resources/", id);
