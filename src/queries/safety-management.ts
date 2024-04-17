import axios, { AxiosError } from "axios";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { SafetyManagementResourceStats } from "../types/api";
import {
  AssessmentStatus,
  Form,
  FormSubmission,
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
  findOne,
  insertOne,
  save,
  updateOne,
} from "./utils";
import { API_BASE_URL } from "../contexts/core/constants";

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
  findOne<ThreatAssessment>("/assessments/submissions/", id);

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
  findOne<Tip>("/tips/submissions/", id);

export const getTipForm = getResourceForm("tips");

export const getTipNotes = (id?: string, query: ItemFilterQueryParams = {}) =>
  findMany<Note>(`/tips/submissions/${id}/notes/`, query);

export const tipToPdf = getResourceAsPDF("tips");

// Violent Incident Reports

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
  findOne<ViolentIncidentReport>("/violent-incident-reports/submissions/", id);

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
  assessment: Partial<ThreatAssessment>
) => save<ThreatAssessment>(`/assessments/submissions/`, assessment);

export const addAssessmentNote = async (
  assessmentId: string | undefined,
  note: Partial<Note>
) =>
  assessmentId
    ? insertOne<Note>(`/assessments/submissions/${assessmentId}/notes`, note)
    : Promise.reject(new Error("Threat assessment ID must not be empty."));

// Safety concerns
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

// Violent Incident Reports
export const saveViolentIncidentReport = async (
  report: Partial<ViolentIncidentReport>
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
    : Promise.reject(
        new Error("Violent Incident Report ID must not be empty.")
      );
