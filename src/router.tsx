import {
	Outlet,
	createBrowserRouter,
	redirect,
	useMatches,
} from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/dashboard/Dashboard";
import TrainingLibrary from "./pages/training-library/TrainingLibrary";
import TipSubmission from "./pages/tip-submission/TipSubmission";
import Login from "./pages/Login";
import AuthProvider from "./contexts/AuthProvider";
import {
	MutationCache,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { PropsWithChildren, useContext, useEffect } from "react";
import { CoreContextProvider } from "./contexts/core/core-context";
import TrainingItem from "./pages/training-library/TrainingItem";
import ThreatAssessmentDashboard from "./pages/threat-assessments/ThreatAssessmentDashboard";
import ThreatAssessmentForm from "./pages/threat-assessments/ThreatAssessmentForm";
import FormBuilder from "./components/forms/FormBuilder";
import { FormsContextProvider } from "./contexts/forms/forms-context";
import { TrainingContextProvider } from "./contexts/training/training-context";
import CourseBuilder from "./pages/training-library/CourseBuilder";
import AdminPanel from "./pages/admin-panel/AdminPanel";
import PublicLayout from "./components/layouts/PublicLayout";
import AdministrativeReportsDashboard from "./pages/administrative-reports/AdministrativeReportsDashboard";
import ViewTrainingSection from "./pages/training-library/ViewTrainingSection";
import { SurveysContextProvider } from "./contexts/surveys/surveys-context";
import Page404 from "./pages/Page404";
import FirstLinkRedirect from "./components/layouts/side-nav/FirstLinkRedirect";
import Organizations from "./pages/admin-panel/organizations/Organizations";
import FormsDashboard from "./pages/admin-panel/forms/FormsDashboard";
import SurveysDashboard from "./pages/admin-panel/surveys/SurveysDashboard";
import {
	ErrorContext,
	ErrorContextProvider,
} from "./contexts/error/error-context";
import UsersDashboard from "./pages/admin-panel/users/UsersDashboard";
import SuccessfulSubmission from "./pages/tip-submission/components/SuccessfulSubmission";
import ResourcePage from "./components/resources/ResourcePage";
import ResourceVideos from "./components/resources/ResourceVideos";
import ResourceDocuments from "./components/resources/ResourceDocuments";
import ResourceItemEntity from "./components/resources/ResourceItem";
import ErrorPage from "./pages/ErrorPage";
import { ViewResources } from "./pages/admin-panel/resources/ViewResources";
import HelpCenter from "./pages/HelpCenter";
import { AxiosError } from "axios";

const QueryContext: React.FC<PropsWithChildren> = ({ children }) => {
	const { setError } = useContext(ErrorContext);

	const handleError = (error: unknown) => {
		if (error instanceof AxiosError && error.response?.status) {
			if (error.response.status >= 400 && error.response.status < 500) {
				setError(error.response?.data?.message ?? error.message ?? `${error}`);
			}
		} else {
			setError("Oops! Something went wrong.");
		}
	};
	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: handleError,
		}),
		mutationCache: new MutationCache({
			onError: handleError,
		}),
	});

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

const Contexts: React.FC<PropsWithChildren> = ({ children }) => {
	return (
		<ErrorContextProvider>
			<QueryContext>
				<CoreContextProvider>
					<FormsContextProvider>
						<SurveysContextProvider>{children}</SurveysContextProvider>
					</FormsContextProvider>
				</CoreContextProvider>
			</QueryContext>
		</ErrorContextProvider>
	);
};

const Root: React.FC = () => {
	const matches = useMatches();
	const titles = matches
		.map((match) => (match.handle as { title?: string })?.title)
		.filter((t) => !!t)
		.reverse();
	useEffect(() => {
		document.title = [...titles, "ThreatZero"].join(" | ");
	}, [titles]);

	return (
		<AuthProvider>
			<Contexts>
				<Outlet />
			</Contexts>
		</AuthProvider>
	);
};

const router = createBrowserRouter(
	[
		{
			path: "/sos",
			handle: { title: "S.O.S." },
			element: (
				<ErrorContextProvider>
					<QueryContext>
						<FormsContextProvider>
							<PublicLayout>
								<Outlet />
							</PublicLayout>
						</FormsContextProvider>
					</QueryContext>
				</ErrorContextProvider>
			),
			children: [
				{
					path: "",
					element: <TipSubmission />,
				},
				{
					path: "success",
					handle: { title: "S.O.S. - Thank you!" },
					element: <SuccessfulSubmission />,
				},
			],
		},
		{
			path: "/",
			element: <Root />,
			children: [
				{
					path: "/login",
					element: <Login />,
				},
				{
					path: "",
					element: <App />,
					children: [
						{
							path: "",
							element: <Dashboard />,
							children: [
								{
									path: "administrative-reports",
									handle: { title: "Administrative Reports" },
									children: [
										{
											path: "",
											element: <AdministrativeReportsDashboard />,
										},
										{
											path: "safety-concerns/:tipId",
											element: <TipSubmission />,
										},
									],
								},
								{
									path: "training",
									element: (
										<TrainingContextProvider>
											<Outlet />
										</TrainingContextProvider>
									),
									children: [
										{
											path: "library",
											handle: { title: "Training Library" },
											children: [
												{
													path: "",
													element: <TrainingLibrary />,
												},
												{
													path: "sections/:sectionId",
													element: <ViewTrainingSection />,
												},
												{
													path: "items/:itemId",
													element: <TrainingItem />,
												},
												{
													path: "manage",
													handle: { title: "Manage" },
													element: <CourseBuilder />,
												},
											],
										},
									],
								},
								{
									path: "safety-concerns",
									handle: { title: "S.O.S." },
									children: [
										{
											path: "",
											element: <TipSubmission />,
										},
										{
											path: "success",
											element: <SuccessfulSubmission />,
										},
										{
											path: ":tipId",
											loader: ({ params }) =>
												redirect(
													`../../administrative-reports/safety-concerns/${params.tipId}`,
												),
										},
									],
								},
								{
									path: "threat-assessments",
									handle: { title: "Threat Assessments" },
									children: [
										{
											path: "",
											element: <ThreatAssessmentDashboard />,
										},
										{
											path: "new",
											element: <ThreatAssessmentForm />,
										},
										{
											path: ":assessmentId",
											element: <ThreatAssessmentForm />,
										},
									],
								},
								{
									path: "admin-panel",
									handle: { title: "Admin Panel" },
									element: <AdminPanel />,
									children: [
										{
											path: "organizations",
											handle: { title: "Organizations" },
											element: <Organizations />,
										},
										{
											path: "forms",
											handle: { title: "Forms" },
											children: [
												{
													path: "",
													element: <FormsDashboard />,
												},
												{
													path: ":slug",
													element: <FormBuilder />,
												},
											],
										},
										{
											path: "resources",
											handle: { title: "Resources" },
											element: <ViewResources />,
										},
										{
											path: "surveys",
											handle: { title: "Surveys" },
											element: <SurveysDashboard />,
										},
										{
											path: "users",
											handle: { title: "Users" },
											element: <UsersDashboard />,
										},
										{
											path: "*?",
											loader: () => redirect("organizations"),
										},
									],
								},
								{
									path: "prevention-resources",
									handle: { title: "Resources" },
									element: <ResourcePage title={"Prevention Resources"} />,
									children: [
										{
											path: "videos",
											handle: { title: "Prevention Videos" },
											element: <ResourceVideos category={"prevention"} />,
										},
										{
											path: "documents",
											handle: { title: "Prevention Documents" },
											element: <ResourceDocuments category={"prevention"} />,
										},
										{
											path: "*?",
											loader: () => redirect("videos"),
										},
									],
								},
								{
									path: "preparation-resources",
									handle: { title: "Resources" },
									element: <ResourcePage title={"Preparation Resources"} />,
									children: [
										{
											path: "videos",
											handle: { title: "Preparation Videos" },
											element: <ResourceVideos category={"preparation"} />,
										},
										{
											path: "documents",
											handle: { title: "Preparation Documents" },
											element: <ResourceDocuments category={"preparation"} />,
										},
										{
											path: "*?",
											loader: () => redirect("videos"),
										},
									],
								},
								{
									path: "response-resources",
									handle: { title: "Resources" },
									element: <ResourcePage title={"Response Resources"} />,
									children: [
										{
											path: "videos",
											handle: { title: "Response Videos" },
											element: <ResourceVideos category={"response"} />,
										},
										{
											path: "documents",
											handle: { title: "Response Documents" },
											element: <ResourceDocuments category={"response"} />,
										},
										{
											path: "*?",
											loader: () => redirect("videos"),
										},
									],
								},
								{
									path: "resources/:id",
									handle: { title: "View Resource" },
									element: <ResourceItemEntity />,
								},
								{
									path: "help-center",
									handle: { title: "Help Center" },
									element: <HelpCenter />,
								},
								{
									path: "",
									element: <FirstLinkRedirect />,
								},
							],
						},
					],
				},
			],
		},
		{
			path: "/error",
			element: (
				<AuthProvider>
					<ErrorPage />
				</AuthProvider>
			),
		},
		{
			path: "/404",
			element: <Page404 />,
		},
		{
			path: "*",
			element: <Page404 />,
		},
	],
	{
		basename: import.meta.env.VITE_BASE_NAME,
	},
);

export default router;
