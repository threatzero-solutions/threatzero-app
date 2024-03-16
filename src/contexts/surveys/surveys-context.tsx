import {
	Dispatch,
	PropsWithChildren,
	createContext,
	useContext,
	useMemo,
	useReducer,
} from "react";
import { UserSurvey } from "../../types/entities";
import Modal from "../../components/layouts/Modal";
import StartSurvey from "../../components/surveys/StartSurvey";
import { CoreContext } from "../core/core-context";

export interface SurveysState {
	surveyDialogOpen?: boolean;
	activeSurvey?: UserSurvey;
}

export interface SurveysAction {
	type: string;
	payload?: any;
}

const INITIAL_STATE: SurveysState = {};

export interface SurveysContextType {
	// REDUCER
	state: SurveysState;
	dispatch: Dispatch<SurveysAction>;

	loadingFinished?: boolean;
}

export const SurveysContext = createContext<SurveysContextType>({
	state: INITIAL_STATE,
	dispatch: () => {},
});

const surveysReducer = (
	state: SurveysState,
	action: SurveysAction,
): SurveysState => {
	switch (action.type) {
		case "SET_SURVEY_DIALOG_OPEN":
			return {
				...state,
				surveyDialogOpen: action.payload,
			};
		case "SET_ACTIVE_SURVEY_FORM":
			return {
				...state,
				activeSurvey: action.payload,
			};
	}

	return state;
};

export const SurveysContextProvider: React.FC<PropsWithChildren<any>> = ({
	children,
}) => {
	const [state, dispatch] = useReducer(surveysReducer, INITIAL_STATE);
	const { interceptorReady } = useContext(CoreContext);

	// const { data: userStartSurveyResponse } = useQuery({
	// 	queryKey: ["user-start-survey-response"],
	// 	queryFn: () => getStartSurveyResponse(),
	// 	enabled: !!interceptorReady,
	// 	refetchOnWindowFocus: false,
	// });

	// const { data: startSurveyForm } = useQuery({
	// 	queryKey: ["survey-form", userStartSurveyResponse?.userSurvey?.id],
	// 	queryFn: ({ queryKey }) => getSurveyForm(queryKey[1]),
	// 	enabled: !!userStartSurveyResponse,
	// 	refetchOnWindowFocus: false,
	// });

	const loadingFinished = useMemo(
		() => interceptorReady,
		[interceptorReady],
		// 		userStartSurveyResponse === null ||
		// 		(!!userStartSurveyResponse && !!startSurveyForm),
		// 	[userStartSurveyResponse, startSurveyForm],
	);

	// useEffect(() => {
	// 	if (startSurveyForm) {
	// 		dispatch({
	// 			type: "SET_ACTIVE_SURVEY_FORM",
	// 			payload: startSurveyForm,
	// 		});
	// 		dispatch({
	// 			type: "SET_SURVEY_DIALOG_OPEN",
	// 			payload: true,
	// 		});
	// 	}
	// }, [startSurveyForm]);

	return (
		<SurveysContext.Provider value={{ state, dispatch, loadingFinished }}>
			{children}
			<Modal
				open={!!state.surveyDialogOpen}
				setOpen={(open) =>
					(open || (!open && !state.activeSurvey?.required)) &&
					dispatch({ type: "SET_SURVEY_DIALOG_OPEN", payload: open })
				}
				focusTotal={state.activeSurvey?.required}
			>
				<StartSurvey />
			</Modal>
		</SurveysContext.Provider>
	);
};
