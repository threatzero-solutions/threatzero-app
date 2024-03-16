import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
	FormSubmission,
	Paginated,
	UserSurvey,
	UserSurveyResponse,
} from "../types/entities";

export const getSurveys = (params: { [key: string]: any } = {}) =>
	axios
		.get<Paginated<UserSurvey>>(`${API_BASE_URL}/api/surveys`, {
			params: {
				...params,
			},
		})
		.then((res) => res.data);

export const getSurveyResponsess = (params: { [key: string]: any } = {}) =>
	axios
		.get<Paginated<UserSurvey>>(`${API_BASE_URL}/api/surveys/responses`, {
			params: {
				...params,
			},
		})
		.then((res) => res.data);

export const getStartSurveyResponse = () =>
	axios
		.get<UserSurveyResponse>(`${API_BASE_URL}/api/surveys/start`)
		.then((res) => (res.status === 200 ? res.data : null));

export const getSurveyForm = (surveyId?: string) =>
	surveyId
		? axios
				.get<UserSurvey>(`${API_BASE_URL}/api/surveys/${surveyId}/form`)
				.then((res) => res.data)
		: Promise.reject(new Error("Survey ID must not be empty."));

// -------- MUTAITONS --------

export const submitStartSurvey = (
	response:
		| Partial<UserSurveyResponse>
		| { submission: Partial<FormSubmission> },
) =>
	axios
		.post<UserSurveyResponse>(`${API_BASE_URL}/api/surveys/start`, response)
		.then((res) => res.data);
