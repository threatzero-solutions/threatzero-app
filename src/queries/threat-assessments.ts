import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Form, Note, ThreatAssessment } from "../types/entities";
import { ThreatAssessmentStats } from "../types/api";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { findMany, findManyRaw, findOne, insertOne, save } from "./utils";

export interface ThreatAssessmentFilterOptions extends ItemFilterQueryParams {
  unitSlug?: string;
  status?: string;
}

export const getThreatAssessments = (
  query: ThreatAssessmentFilterOptions = {}
) => findMany<ThreatAssessment>("/assessments/submissions/", query);

export const getThreatAssessmentStats = (
  query: ThreatAssessmentFilterOptions = {}
) => findManyRaw<ThreatAssessmentStats>("/assessments/stats/", query);

export const getThreatAssessment = (id?: string) =>
  findOne<ThreatAssessment>("/assessments/submissions/", id);

export const getThreatAssessmentForm = (
  options: {
    version?: string;
    id?: string;
  } = {}
) =>
  axios
    .get<Form>(`${API_BASE_URL}/assessments/form/`, {
      params: {
        ...options,
      },
    })
    .then((res) => res.data)
    .catch((e) => {
      if (e instanceof AxiosError && e.response?.status === 404) {
        return null;
      }
      throw e;
    });

export const getAssessmentNotes = (
  id?: string,
  query: ItemFilterQueryParams = {}
) => findMany<Note>(`/assessments/submissions/${id}/notes/`, query);

export const assessmentToPdf = (id?: string) =>
  id
    ? axios
        .get(`${API_BASE_URL}/assessments/submissions/${id}/pdf`, {
          responseType: "arraybuffer",
        })
        .then((res) => res.data)
    : Promise.reject(new Error("Threat assessment ID must not be empty."));

// ------- MUTATIONS ---------

export const saveThreatAssessment = async (
  assessment: Partial<ThreatAssessment>
) => save<ThreatAssessment>(`/assessments/submissions/`, assessment);

export const addAssessmentNote = async (
  assessmentId: string | undefined,
  note: Partial<Note>
) =>
  assessmentId
    ? insertOne<Note>(`/assessments/submissions/${assessmentId}/notes`, note)
    : Promise.reject(new Error("Threat assessment ID must not be empty."));
