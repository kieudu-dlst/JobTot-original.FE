import { createBrowserRouter, Link, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { JobsPage } from "@/pages/jobs";
import { JobDetailPage } from "@/pages/job-detail";
import { MyJobsPage } from "@/pages/my-jobs";
import { RootLayout } from "./root-layout";
import { AdminPage } from "@/pages/admin";
import { AdminArticlesPage, ArticlesPage } from "@/pages/career-articles";
import { EmployerAccountPage } from "@/pages/auth";
import { EmployerCompanyPage } from "@/pages/employer-company";
import { CampaignListPage, CampaignEditPage } from "@/pages/employer-campaigns";
import { EmployerCandidatesPage } from "@/pages/employer-candidates";
import { EmployerDiscoveryPage } from "@/pages/employer-discovery";
import { MessagesPage } from "@/pages/messages";
import { AuthPage } from "@/pages/auth";
import { ResetPasswordPage } from "@/pages/auth";
import { ProfilePage } from "@/pages/profile";
import { CompaniesPage, CompanyDetailPage } from "@/pages/companies";
import { TopIndustriesPage } from "@/pages/top-industries";
import { ToolsPage } from "@/pages/tools";
import { SalaryPage } from "@/pages/salary";
import { IncomeTaxPage } from "@/pages/income-tax";
import { UnemploymentPage } from "@/pages/unemployment";
import { SocialInsurancePage } from "@/pages/social-insurance";
import {
  CvTemplatesPage,
  CvTemplatePreviewPage,
  MyCvsPage,
  CvEditPage,
  AdminCvTemplatesPage,
  AdminCvEditPage,
} from "@/pages/cv-studio";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";

export const router = createBrowserRouter([
  { path: "/admin/career-articles", element: <AdminArticlesPage /> },
  { path: "/career-articles", element: <ArticlesPage /> },
  { path: "/career-articles/:id", element: <ArticlesPage /> },
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <AuthPage mode="register" /> },
  { path: "/employer/account", element: <EmployerAccountPage /> },
  { path: "/employer/company", element: <EmployerCompanyPage /> },
  { path: "/employer/campaigns", element: <CampaignListPage /> },
  { path: "/employer/campaigns/new", element: <CampaignEditPage /> },
  { path: "/employer/campaigns/:id/edit", element: <CampaignEditPage /> },
  { path: "/employer/talents", element: <EmployerCandidatesPage view="talents" /> },
  { path: "/employer/discover", element: <EmployerDiscoveryPage /> },
  { path: "/employer/candidates", element: <EmployerCandidatesPage view="applications" /> },
  { path: "/employer/interviews", element: <EmployerCandidatesPage view="interviews" /> },
  { path: "/messages", element: <MessagesPage /> },
  { path: "/employer/messages", element: <MessagesPage employer /> },
  { path: "/login", element: <AuthPage mode="login" /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/companies", element: <CompaniesPage /> },
  { path: "/top-industries", element: <TopIndustriesPage /> },
  { path: "/tools", element: <ToolsPage /> },
  { path: "/tools/gross-net", element: <SalaryPage /> },
  { path: "/tools/income-tax", element: <IncomeTaxPage /> },
  { path: "/tools/unemployment-insurance", element: <UnemploymentPage /> },
  { path: "/tools/social-insurance", element: <SocialInsurancePage /> },
  { path: "/cv-templates", element: <CvTemplatesPage /> },
  { path: "/cv-templates/:id", element: <CvTemplatePreviewPage /> },
  { path: "/my-cvs", element: <MyCvsPage /> },
  { path: "/my-cvs/:id/edit", element: <CvEditPage /> },
  { path: "/admin/cv-templates", element: <AdminCvTemplatesPage /> },
  { path: "/admin", element: <Navigate to="/admin/companies" replace /> },
  { path: "/admin/:section", element: <AdminPage /> },
  { path: "/admin/cv-templates/new", element: <AdminCvEditPage /> },
  { path: "/admin/cv-templates/:id/edit", element: <AdminCvEditPage /> },
  { path: "/companies/:id", element: <CompanyDetailPage /> },
  { path: "/jobs", element: <JobsPage /> },
  { path: "/jobs/:id", element: <JobDetailPage /> },
  { path: "/my-jobs", element: <MyJobsPage /> },
  { path: "/saved-jobs", element: <Navigate to="/my-jobs?tab=saved" replace /> },
  {
    element: <RootLayout />,
    children: [
      {
        path: "*",
        element: (
          <main className="mx-auto max-w-6xl px-6 py-24">
            <PageBreadcrumb current="Không tìm thấy trang" />
            <h1 className="mb-4 text-3xl font-bold">Không tìm thấy trang</h1>
            <Link className="underline" to="/jobs">
              Quay lại danh sách việc làm
            </Link>
          </main>
        ),
      },
    ],
  },
]);
