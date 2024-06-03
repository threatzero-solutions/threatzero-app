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
import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { CoreContextProvider } from "./contexts/core/core-context";
import TrainingItem from "./pages/training-library/TrainingItem";
import ThreatAssessmentDashboard from "./pages/safety-management/threat-assessments/ThreatAssessmentDashboard";
import ThreatAssessmentForm from "./pages/safety-management/threat-assessments/ThreatAssessmentForm";
import FormBuilder from "./components/forms/FormBuilder";
import { FormsContextProvider } from "./contexts/forms/forms-context";
import { TrainingContextProvider } from "./contexts/training/training-context";
import CourseBuilder from "./pages/training-library/CourseBuilder";
import AdminPanel from "./pages/admin-panel/AdminPanel";
import PublicLayout from "./components/layouts/PublicLayout";
import MyDashboard from "./pages/my-dashboard/MyDashboard";
import ViewTrainingSection from "./pages/training-library/ViewTrainingSection";
import Page404 from "./pages/Page404";
import FirstLinkRedirect from "./components/layouts/side-nav/FirstLinkRedirect";
import Organizations from "./pages/admin-panel/organizations/Organizations";
import FormsDashboard from "./pages/admin-panel/forms/FormsDashboard";
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
import SafetyConcernsDashboard from "./pages/safety-management/safety-concerns/SafetyConcernsDashboard";
import { ResourceItemCategories } from "./types/entities";
import SafetyManagementRoot from "./pages/safety-management/SafetyManagementRoot";
import ViolentIncidentReportsDashboard from "./pages/safety-management/violent-incident-reports/ViolentIncidentReportsDashboard";
import ViolentIncidentReportForm from "./pages/safety-management/violent-incident-reports/ViolentIncidentReportForm";
import { ViewLanguages } from "./pages/admin-panel/languages/ViewLanguages";

const QueryContext: React.FC<PropsWithChildren> = ({ children }) => {
  const { setError } = useContext(ErrorContext);

  const handleError = (error: unknown) => {
    console.error(error);
    if (error instanceof AxiosError && error.response?.status) {
      if (error.response.status >= 400 && error.response.status < 500) {
        setError(error.response?.data?.message ?? error.message ?? `${error}`);
      }
    } else {
      setError("Oops! Something went wrong.");
    }
  };

  const [queryClient] = useState(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: handleError,
      }),
      mutationCache: new MutationCache({
        onError: handleError,
      }),
    });
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
            <TrainingContextProvider>{children}</TrainingContextProvider>
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

export const router = createBrowserRouter(
  [
    {
      path: "/sos",
      handle: { title: "S.O.S." },
      errorElement: <ErrorPage />,
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
      errorElement: <ErrorPage />,
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
                  path: "dashboard",
                  handle: { title: "My Dashboard" },
                  children: [
                    {
                      path: "",
                      element: <MyDashboard />,
                    },
                    {
                      path: "safety-concerns/:tipId",
                      element: <TipSubmission />,
                    },
                  ],
                },
                {
                  path: "training",
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
                          `../../administrative-reports/safety-concerns/${params.tipId}`
                        ),
                    },
                  ],
                },
                {
                  path: "safety-management",
                  handle: { title: "Safety Management" },
                  element: <SafetyManagementRoot />,
                  children: [
                    // {
                    //   path: "poc-files",
                    //   handle: { title: "POC Files" },
                    //   element: <POCFilesDashboard />,
                    // },
                    {
                      path: "safety-concerns",
                      handle: { title: "Administrative Reports" },
                      children: [
                        {
                          path: "",
                          element: <SafetyConcernsDashboard />,
                        },
                        {
                          path: ":tipId",
                          element: <TipSubmission />,
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
                      path: "violent-incident-reports",
                      handle: { title: "Violent Incident Log" },
                      children: [
                        {
                          path: "",
                          element: <ViolentIncidentReportsDashboard />,
                        },
                        {
                          path: "new",
                          element: <ViolentIncidentReportForm />,
                        },
                        {
                          path: ":reportId",
                          element: <ViolentIncidentReportForm />,
                        },
                      ],
                    },
                    // {
                    //   path: "*?",
                    //   loader: () => redirect("poc-files"),
                    // },
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
                      path: "languages",
                      handle: { title: "Languages" },
                      element: <ViewLanguages />,
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
                  path: "resources/:category",
                  handle: { title: "Resources" },
                  loader: ({ params }) => {
                    if (
                      !ResourceItemCategories.includes(params.category as any)
                    ) {
                      return redirect("/");
                    }
                    return null;
                  },
                  children: [
                    {
                      path: "",
                      element: <ResourcePage />,
                      children: [
                        {
                          path: "videos",
                          handle: { title: "Videos" },
                          element: <ResourceVideos />,
                        },
                        {
                          path: "documents",
                          handle: { title: "Documents" },
                          element: <ResourceDocuments />,
                        },
                        {
                          path: "*?",
                          loader: () => redirect("videos"),
                        },
                      ],
                    },
                    {
                      path: ":id",
                      handle: { title: "View Resource" },
                      element: <ResourceItemEntity />,
                    },
                  ],
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
      path: "support",
      element: (
        <PublicLayout>
          <HelpCenter />
        </PublicLayout>
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
    basename: import.meta.env.VITE_BASE_NAME ?? "/",
  }
);
