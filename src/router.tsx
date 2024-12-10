import { createBrowserRouter, redirect, RouteObject } from "react-router";
import App from "./App";
import FormBuilder from "./components/forms/FormBuilder";
import PublicLayout from "./components/layouts/PublicLayout";
import PublicRoot from "./components/layouts/PublicRoot";
import Root from "./components/layouts/Root";
import FirstLinkRedirect from "./components/layouts/side-nav/FirstLinkRedirect";
import ResourceDocuments from "./components/resources/ResourceDocuments";
import ResourceItemEntity from "./components/resources/ResourceItem";
import ResourcePage from "./components/resources/ResourcePage";
import ResourceVideos from "./components/resources/ResourceVideos";
import AuthProvider from "./contexts/auth/AuthProvider";
import AdminPanel from "./pages/admin-panel/AdminPanel";
import CourseBuilder from "./pages/admin-panel/courses/CourseBuilder";
import PreviewCourse from "./pages/admin-panel/courses/PreviewCourse";
import ViewCourses from "./pages/admin-panel/courses/ViewCourses";
import FormsDashboard from "./pages/admin-panel/forms/FormsDashboard";
import { ViewLanguages } from "./pages/admin-panel/languages/ViewLanguages";
import ManageOrganization from "./pages/admin-panel/organizations/levels/ManageOrganization";
import Organizations from "./pages/admin-panel/organizations/Organizations";
import { ViewResources } from "./pages/admin-panel/resources/ViewResources";
import UsersDashboard from "./pages/admin-panel/users/UsersDashboard";
import Dashboard from "./pages/dashboard/Dashboard";
import ErrorPage from "./pages/ErrorPage";
import HelpCenter from "./pages/HelpCenter";
import Login from "./pages/Login";
import MyDashboard from "./pages/my-dashboard/MyDashboard";
import OrganizationsRoot from "./pages/organizations/OrganizationsRoot";
import OrganizationsSafety from "./pages/organizations/tabs/OrganizationsSafety";
import OrganizationsSettings from "./pages/organizations/tabs/OrganizationsSettings";
import OrganizationsTraining from "./pages/organizations/tabs/OrganizationsTraining";
import OrganizationsUnits from "./pages/organizations/tabs/OrganizationsUnits";
import OrganizationsUsers from "./pages/organizations/tabs/OrganizationsUsers";
import Page404 from "./pages/Page404";
import SafetyConcernsDashboard from "./pages/safety-management/safety-concerns/SafetyConcernsDashboard";
import SafetyManagementRoot from "./pages/safety-management/SafetyManagementRoot";
import ThreatAssessmentDashboard from "./pages/safety-management/threat-assessments/ThreatAssessmentDashboard";
import ThreatAssessmentForm from "./pages/safety-management/threat-assessments/ThreatAssessmentForm";
import ManageTrainingInvites from "./pages/safety-management/training-admin/ManageTrainingInvites";
import TrainingAdminDashboard from "./pages/safety-management/training-admin/TrainingAdminDashboard";
import ViewWatchStats from "./pages/safety-management/training-admin/ViewWatchStats";
import ViolentIncidentReportForm from "./pages/safety-management/violent-incident-reports/ViolentIncidentReportForm";
import ViolentIncidentReportsDashboard from "./pages/safety-management/violent-incident-reports/ViolentIncidentReportsDashboard";
import SuccessfulSubmission from "./pages/tip-submission/components/SuccessfulSubmission";
import TipSubmission from "./pages/tip-submission/TipSubmission";
import TrainingItem from "./pages/training-library/TrainingItem";
import TrainingLibrary from "./pages/training-library/TrainingLibrary";
import ViewTrainingSection from "./pages/training-library/ViewTrainingSection";
import { ResourceItemCategories, ResourceItemCategory } from "./types/entities";

const organizationsChildren: RouteObject[] = [
  {
    path: "units",
    handle: { title: "Units" },
    element: <OrganizationsUnits />,
  },
  {
    path: "users",
    handle: { title: "Users" },
    element: <OrganizationsUsers />,
  },
  {
    path: "training",
    handle: { title: "Training" },
    element: <OrganizationsTraining />,
  },
  {
    path: "safety",
    handle: { title: "Safety" },
    element: <OrganizationsSafety />,
  },
  {
    path: "settings",
    handle: { title: "Settings" },
    element: <OrganizationsSettings />,
  },
  {
    path: "*?",
    loader: () => redirect("units"),
  },
];

export const router = createBrowserRouter(
  [
    {
      path: "/sos",
      handle: { title: "S.O.S." },
      element: <PublicRoot />,
      errorElement: <ErrorPage />,
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
      path: "/watch-training/:itemId",
      handle: { title: "Watch Training" },
      element: <PublicRoot />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "",
          element: <TrainingItem />,
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
                      path: "training-admin",
                      handle: { title: "Training Admin" },
                      element: <TrainingAdminDashboard />,
                      children: [
                        {
                          path: "completions",
                          handle: { title: "View Training Completions" },
                          element: <ViewWatchStats />,
                        },
                        {
                          path: "invites",
                          handle: { title: "Manage Invites" },
                          element: <ManageTrainingInvites />,
                        },
                        {
                          path: "*?",
                          loader: () => redirect("completions"),
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
                      children: [
                        {
                          path: "",
                          element: <Organizations />,
                        },
                        {
                          path: ":id",
                          element: <ManageOrganization />,
                          children: organizationsChildren,
                        },
                      ],
                    },
                    {
                      path: "courses",
                      handle: { title: "Courses" },
                      children: [
                        {
                          path: "",
                          element: <ViewCourses />,
                        },
                        {
                          path: "preview/:id",
                          element: <PreviewCourse />,
                        },
                        {
                          path: ":id",
                          element: <CourseBuilder />,
                        },
                      ],
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
                      !ResourceItemCategories.includes(
                        params.category as ResourceItemCategory
                      )
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
                  path: "my-organization",
                  handle: { title: "My Organization" },
                  element: <OrganizationsRoot />,
                  children: organizationsChildren,
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
