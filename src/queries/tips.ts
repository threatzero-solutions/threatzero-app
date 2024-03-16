import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { Form, FormSubmission, Note, Paginated, Tip } from "../types/entities";
import { TipSubmissionStats } from "../types/api";
import { DataTableQueryParams } from "../components/layouts/DataTable";

export const getTipForm = () =>
	axios
		.get<Form>(`${API_BASE_URL}/api/tips/form/`)
		.then((res) => res.data)
		.catch((e) => {
			console.error(e);
			return null;
		});

export interface TipSubmissionFilterOptions extends DataTableQueryParams {
	status?: string;
	unitSlug?: string;
}

export const getTipSubmissions = (options: TipSubmissionFilterOptions = {}) =>
	axios
		.get<Paginated<Tip>>(`${API_BASE_URL}/api/tips/submissions/`, {
			params: {
				limit: options.limit,
				offset: options.offset ?? 0,
				status: options.status,
				unitSlug: options.unitSlug,
				order: options.order,
			},
		})
		.then((res) => res.data);

export const getTipSubmissionStats = (options?: TipSubmissionFilterOptions) =>
	axios
		.get<TipSubmissionStats>(`${API_BASE_URL}/api/tips/stats/`, {
			params: {
				unitSlug: options?.unitSlug,
				organizationSlug: options?.organizationSlug,
			},
		})
		.then((res) => res.data);

export const getTipSubmission = (id?: string) =>
	id
		? axios
				.get<Tip>(`${API_BASE_URL}/api/tips/submissions/${id}`)
				.then((res) => res.data)
				.catch((e) => {
					console.error(e);
					return null;
				})
		: Promise.reject(new Error("Tip submission ID must not be empty."));

export const getTipNotes = (id?: string) =>
	id
		? axios
				.get<Paginated<Note>>(
					`${API_BASE_URL}/api/tips/submissions/${id}/notes`,
				)
				.then((res) => res.data)
		: Promise.reject(new Error("Tip ID must not be empty."));

// -------- MUTATIONS ---------

export type SubmitTipInput =
	| Partial<Tip>
	| { submission: Partial<FormSubmission> };
export const submitTip = async (tip: SubmitTipInput, locationId?: string) =>
	axios
		.post<Tip>(`${API_BASE_URL}/api/tips/submit`, tip, {
			params: {
				locationId,
			},
		})
		.then((res) => res.data);

export const saveTip = async (tip: Partial<Tip>) =>
	tip.id
		? axios
				.patch<Tip>(`${API_BASE_URL}/api/tips/submissions/${tip.id}`, tip)
				.then((res) => res.data)
		: Promise.reject(new Error("Tip ID must not be empty."));

export const addTipNote = async (
	tipId: string | undefined,
	note: Partial<Note>,
) =>
	tipId
		? axios
				.post<Note>(`${API_BASE_URL}/api/tips/submissions/${tipId}/notes`, note)
				.then((res) => res.data)
		: Promise.reject(new Error("Tip ID must not be empty."));
