import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Form, FormSubmission, Note, Tip } from "../types/entities";
import { TipSubmissionStats } from "../types/api";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { findMany, findManyRaw, findOne, insertOne, updateOne } from "./utils";

export const getTipForm = () =>
  axios
    .get<Form>(`${API_BASE_URL}/tips/form/`)
    .then((res) => res.data)
    .catch((e) => {
      if (e instanceof AxiosError && e.response?.status === 404) {
        return null;
      }
      throw e;
    });

export interface TipSubmissionFilterOptions extends ItemFilterQueryParams {
  status?: string;
  unitSlug?: string;
}

export const getTipSubmissions = (options: TipSubmissionFilterOptions = {}) =>
  findMany<Tip>("/tips/submissions/", options);

export const getTipSubmissionStats = (query: TipSubmissionFilterOptions = {}) =>
  findManyRaw<TipSubmissionStats>("/tips/stats/", query);

export const getTipSubmission = (id?: string) =>
  findOne<Tip>("/tips/submissions/", id);

export const getTipNotes = (id?: string, query: ItemFilterQueryParams = {}) =>
  findMany<Note>(`/tips/submissions/${id}/notes/`, query);

// -------- MUTATIONS ---------

export type SubmitTipInput =
  | Partial<Tip>
  | { submission: Partial<FormSubmission> };
export const submitTip = async (tip: SubmitTipInput, locationId?: string) =>
  insertOne<Tip>("/tips/submit", tip as Partial<Tip>, {
    params: {
      locationId,
    },
  });

export const saveTip = (tip: Partial<Tip>) =>
  tip.id
    ? updateOne<Tip>(`/tips/submissions/`, tip)
    : Promise.reject(new Error("Tip ID must not be empty."));

export const addTipNote = (tipId: string | undefined, note: Partial<Note>) =>
  tipId
    ? insertOne<Note>(`/tips/submissions/${tipId}/notes`, note)
    : Promise.reject(new Error("Tip ID must not be empty."));
