import { useContext } from "react";
import { SurveysContext } from "../../contexts/surveys/surveys-context";
import Form from "../forms/Form";
import { FormSubmission } from "../../types/entities";
import { submitStartSurvey } from "../../queries/surveys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../contexts/core/constants";
import { useAuth } from "../../contexts/AuthProvider";

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/api/surveys/submissions/presigned-upload-urls`;

const StartSurvey: React.FC = () => {
	const { state, dispatch } = useContext(SurveysContext);
	const { keycloak } = useAuth();

	const queryClient = useQueryClient();
	const surveyMutation = useMutation({
		mutationFn: submitStartSurvey,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ["user-start-survey-response"]});
			dispatch({ type: "SET_SURVEY_DIALOG_OPEN", payload: false });
		},
	});

	const handleSubmit = (
		event: React.FormEvent<HTMLFormElement>,
		submission: Partial<FormSubmission>,
	) => {
		event.preventDefault();

		surveyMutation.mutate({
			submission,
		});
	};

	return (
		<div>
			<Form
				form={state.activeSurvey?.form}
				onSubmit={handleSubmit}
				background="bg-white"
				mediaUploadUrl={MEDIA_UPLOAD_URL}
			/>
			<button
				onClick={() =>
					keycloak?.logout({
						redirectUri: window.location.origin,
					})
				}
				className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 outline-none"
			>
				<span aria-hidden="true">&larr;</span> Sign Out
			</button>
		</div>
	);
};

export default StartSurvey;
