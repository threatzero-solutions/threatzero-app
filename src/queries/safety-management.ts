import axios, { AxiosError } from "axios";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { SafetyManagementResourceStats } from "../types/api";
import {
  AssessmentStatus,
  Form,
  Note,
  POCFile,
  ThreatAssessment,
  Tip,
  TipStatus,
  ViolentIncidentReport,
  ViolentIncidentReportStatus,
} from "../types/entities";
import {
  findMany,
  findManyRaw,
  findOneById,
  insertOne,
  save,
  updateOne,
} from "./utils";
import { API_BASE_URL } from "../contexts/core/constants";
import { DeepPartial } from "../types/core";

// General

export interface SafetyManagementResourceFilterOptions
  extends ItemFilterQueryParams {
  unitSlug?: string;
  status?: string;
}

export const getResourceForm =
  (resourceName: string) =>
  (
    options: {
      version?: string;
      id?: string;
      language_code?: string;
    } = {}
  ) =>
    axios
      .get<Form>(`${API_BASE_URL}/${resourceName}/form/`, {
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

export const getResourceForms = (resourceName: string) => () =>
  axios
    .get<Form[]>(`${API_BASE_URL}/${resourceName}/forms/`)
    .then((res) => res.data);

export const getResourceAsPDF = (resourceName: string) => (id?: string) =>
  id
    ? axios
        .get(`${API_BASE_URL}/${resourceName}/submissions/${id}/pdf`, {
          responseType: "arraybuffer",
        })
        .then((res) => res.data)
    : Promise.reject(new Error(`${resourceName} ID must not be empty.`));

// POC Files

export const getPOCFiles = (query: ItemFilterQueryParams = {}) =>
  findMany<POCFile>("/safety-management/poc-files/", query);

// Threat Assessments

export const getThreatAssessments = (
  query: SafetyManagementResourceFilterOptions = {}
) => findMany<ThreatAssessment>("/assessments/submissions/", query);

export const getThreatAssessmentStats = (
  query: SafetyManagementResourceFilterOptions = {}
) =>
  findManyRaw<SafetyManagementResourceStats<AssessmentStatus>>(
    "/assessments/stats/",
    query
  );

export const getThreatAssessment = (id?: string) =>
  findOneById<ThreatAssessment>("/assessments/submissions/", id);

export const getThreatAssessmentForm = getResourceForm("assessments");

export const getAssessmentNotes = (
  id?: string,
  query: ItemFilterQueryParams = {}
) => findMany<Note>(`/assessments/submissions/${id}/notes/`, query);

export const assessmentToPdf = getResourceAsPDF("assessments");

// Safety concerns

export const getTipSubmissions = (
  query: SafetyManagementResourceFilterOptions = {}
) => findMany<Tip>("/tips/submissions/", query);

export const getTipSubmissionStats = (
  query: SafetyManagementResourceFilterOptions = {}
) =>
  findManyRaw<SafetyManagementResourceStats<TipStatus>>("/tips/stats/", query);

export const getTipSubmission = (id?: string) =>
  findOneById<Tip>("/tips/submissions/", id);

export const getTipForm = getResourceForm("tips");

export const getTipForms = getResourceForms("tips");

export const getTipNotes = (id?: string, query: ItemFilterQueryParams = {}) =>
  findMany<Note>(`/tips/submissions/${id}/notes/`, query);

export const tipToPdf = getResourceAsPDF("tips");

// Violent Incident Log

export const getViolentIncidentReports = (
  query: SafetyManagementResourceFilterOptions = {}
) =>
  findMany<ViolentIncidentReport>(
    "/violent-incident-reports/submissions/",
    query
  );

export const getViolentIncidentReportSubmissionStats = (
  query: SafetyManagementResourceFilterOptions = {}
) =>
  findManyRaw<SafetyManagementResourceStats<ViolentIncidentReportStatus>>(
    "/violent-incident-reports/stats/",
    query
  );

export const getViolentIncidentReportSubmission = (id?: string) =>
  findOneById<ViolentIncidentReport>(
    "/violent-incident-reports/submissions/",
    id
  );

export const getViolentIncidentReportForm = getResourceForm(
  "violent-incident-reports"
);

export const getViolentIncidentReportNotes = (
  id?: string,
  query: ItemFilterQueryParams = {}
) =>
  findMany<Note>(`/violent-incident-reports/submissions/${id}/notes/`, query);

export const violentIncidentReportToPdf = getResourceAsPDF(
  "violent-incident-reports"
);

// ------- MUTATIONS ---------

// Threat Assessments
export const saveThreatAssessment = async (
  assessment: DeepPartial<ThreatAssessment>
) => save<ThreatAssessment>(`/assessments/submissions/`, assessment);

export const addAssessmentNote = async (
  assessmentId: string | undefined,
  note: Partial<Note>
) =>
  assessmentId
    ? insertOne<Note>(`/assessments/submissions/${assessmentId}/notes`, note)
    : Promise.reject(new Error("Threat assessment ID must not be empty."));

// Safety concerns
export const submitTip = async (tip: DeepPartial<Tip>, locationId?: string) =>
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

// Violent Incident Log
export const saveViolentIncidentReport = async (
  report: DeepPartial<ViolentIncidentReport>
) =>
  save<ViolentIncidentReport>(`/violent-incident-reports/submissions/`, report);

export const addViolentIncidentReportNote = async (
  reportId: string | undefined,
  note: Partial<Note>
) =>
  reportId
    ? insertOne<Note>(
        `/violent-incident-reports/submissions/${reportId}/notes`,
        note
      )
    : Promise.reject(new Error("Violent Incident Log ID must not be empty."));
