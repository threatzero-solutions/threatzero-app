import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Form, Note, Paginated, ThreatAssessment } from "../types/entities";
import { ThreatAssessmentStats } from "../types/api";
import { DataTableQueryParams } from "../components/layouts/DataTable";

export interface ThreatAssessmentFilterOptions extends DataTableQueryParams {
	unitSlug?: string;
	status?: string;
}

export const getThreatAssessments = (
	options: ThreatAssessmentFilterOptions = {},
) =>
	axios
		.get<Paginated<ThreatAssessment>>(
			`${API_BASE_URL}/api/assessments/submissions/`,
			{
				params: {
					limit: options.limit,
					offset: options.offset ?? 0,
					unitSlug: options?.unitSlug,
					status: options?.status,
					order: options.order,
				},
			},
		)
		.then((res) => res.data);

export const getThreatAssessmentStats = (
	options?: ThreatAssessmentFilterOptions,
) =>
	axios
		.get<ThreatAssessmentStats>(`${API_BASE_URL}/api/assessments/stats/`, {
			params: {
				unitSlug: options?.unitSlug,
				organizationSlug: options?.organizationSlug,
			},
		})
		.then((res) => res.data);

export const getThreatAssessment = (id?: string) =>
	id
		? axios
				.get<ThreatAssessment>(
					`${API_BASE_URL}/api/assessments/submissions/${id}`,
				)
				.then((res) => res.data)
				.catch((e) => {
					console.error(e);
					return null;
				})
		: Promise.reject(new Error("Threat assessment ID must not be empty."));

export const getThreatAssessmentForm = (
	options: {
		version?: string;
		id?: string;
	} = {},
) =>
	axios
		.get<Form>(`${API_BASE_URL}/api/assessments/form/`, {
			params: options ?? {},
		})
		.then((res) => res.data)
		.catch((e) => {
			console.error(e);
			return null;
		});

export const getAssessmentNotes = (id?: string) =>
	id
		? axios
				.get<Paginated<Note>>(
					`${API_BASE_URL}/api/assessments/submissions/${id}/notes`,
				)
				.then((res) => res.data)
		: Promise.reject(new Error("Threat assessment ID must not be empty."));

export const assessmentToPdf = (id?: string) =>
	id
		? axios
				.get(`${API_BASE_URL}/api/assessments/submissions/${id}/pdf`, {
					responseType: "arraybuffer",
				})
				.then((res) => res.data)
		: Promise.reject(new Error("Threat assessment ID must not be empty."));

// ------- MUTATIONS ---------

export const saveThreatAssessment = async (
	id: string | undefined,
	assessment: Partial<ThreatAssessment>,
) => {
	const method = id ? "patch" : "post";
	return axios[method](
		`${API_BASE_URL}/api/assessments/submissions/` + (id ?? ""),
		assessment,
	).then((res) => res.data);
};

export const addAssessmentNote = async (
	assessmentId: string | undefined,
	note: Partial<Note>,
) =>
	assessmentId
		? axios
				.post<Note>(
					`${API_BASE_URL}/api/assessments/submissions/${assessmentId}/notes`,
					note,
				)
				.then((res) => res.data)
		: Promise.reject(new Error("Threat assessment ID must not be empty."));
