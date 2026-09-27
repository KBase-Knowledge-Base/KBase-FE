import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/public-layout';
import { AuthLayout } from './layouts/auth-layout';
import { AppLayout } from './layouts/app-layout';
import { ProjectLayout } from './layouts/project-layout';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './guards';
import { RouteErrorBoundary } from '@/pages/system/error-boundary';
import { ContentSkeleton } from '@/shared/ui/skeleton';

// Suspense Loader Component
// eslint-disable-next-line react-refresh/only-export-components
const PageLoader: React.FC = () => (
  <div className="p-8 max-w-5xl mx-auto space-y-6" role="status">
    <ContentSkeleton height={32} width={260} />
    <ContentSkeleton height={140} />
    <ContentSkeleton height={300} />
  </div>
);

// Lazy Loaded Pages
const LandingPage = lazy(() =>
  import('@/pages/landing/landing-page').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/register-page').then((m) => ({ default: m.RegisterPage }))
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/auth/verify-email-page').then((m) => ({ default: m.VerifyEmailPage }))
);
const AcceptInvitationPage = lazy(() =>
  import('@/pages/auth/accept-invitation-page').then((m) => ({ default: m.AcceptInvitationPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/projects/projects-page').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectOverviewPage = lazy(() =>
  import('@/pages/projects/project-overview-page').then((m) => ({ default: m.ProjectOverviewPage }))
);
const DocumentsPage = lazy(() =>
  import('@/pages/documents/documents-page').then((m) => ({ default: m.DocumentsPage }))
);
const DocumentDetailPage = lazy(() =>
  import('@/pages/documents/document-detail-page').then((m) => ({ default: m.DocumentDetailPage }))
);
const ProjectMembersPage = lazy(() =>
  import('@/pages/projects/project-members-page').then((m) => ({ default: m.ProjectMembersPage }))
);
const ProjectInvitationsPage = lazy(() =>
  import('@/pages/projects/project-invitations-page').then((m) => ({ default: m.ProjectInvitationsPage }))
);
const ProjectOrganizationPage = lazy(() =>
  import('@/pages/projects/project-organization-page').then((m) => ({ default: m.ProjectOrganizationPage }))
);
const ProjectSettingsPage = lazy(() =>
  import('@/pages/projects/project-settings-page').then((m) => ({ default: m.ProjectSettingsPage }))
);
const ProjectAssistantPage = lazy(() =>
  import('@/pages/assistant/project-assistant-page').then((m) => ({ default: m.ProjectAssistantPage }))
);
const GuidePage = lazy(() =>
  import('@/pages/guide/guide-page').then((m) => ({ default: m.GuidePage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/settings/profile-page').then((m) => ({ default: m.ProfilePage }))
);
const SecurityPage = lazy(() =>
  import('@/pages/settings/security-page').then((m) => ({ default: m.SecurityPage }))
);
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/admin-users-page').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminUserDetailPage = lazy(() =>
  import('@/pages/admin/admin-user-detail-page').then((m) => ({ default: m.AdminUserDetailPage }))
);
const AdminProjectsPage = lazy(() =>
  import('@/pages/admin/admin-projects-page').then((m) => ({ default: m.AdminProjectsPage }))
);
const ForbiddenPage = lazy(() =>
  import('@/pages/system/forbidden-page').then((m) => ({ default: m.ForbiddenPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/system/not-found-page').then((m) => ({ default: m.NotFoundPage }))
);

export const router = createBrowserRouter([
  // Public Landing (UI01)
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        ),
      },
    ],
  },

  // Auth Pages (UI02, UI03, UI04, UI05)
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'verify-email',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
      {
        path: 'invitations/accept',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AcceptInvitationPage />
          </Suspense>
        ),
      },
    ],
  },

  // System Forbidden (UI21)
  {
    path: 'forbidden',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForbiddenPage />
      </Suspense>
    ),
  },

  // App Redirects
  {
    path: 'app',
    element: <Navigate to="/app/projects" replace />,
  },
  {
    path: 'app/settings',
    element: <Navigate to="/app/settings/profile" replace />,
  },

  // Protected App Workspace
  {
    path: 'app',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // UI06: My Projects
          {
            path: 'projects',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProjectsPage />
              </Suspense>
            ),
          },

          // Project Workspace (UI07, UI08, UI10, UI11, UI12, UI13, UI14)
          {
            path: 'projects/:projectId',
            element: <ProjectLayout />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectOverviewPage />
                  </Suspense>
                ),
              },
              {
                path: 'documents',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <DocumentsPage />
                  </Suspense>
                ),
              },
              {
                path: 'members',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectMembersPage />
                  </Suspense>
                ),
              },
              {
                path: 'invitations',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectInvitationsPage />
                  </Suspense>
                ),
              },
              {
                path: 'organization',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectOrganizationPage />
                  </Suspense>
                ),
              },
              {
                path: 'settings',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectSettingsPage />
                  </Suspense>
                ),
              },
              {
                path: 'assistant',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectAssistantPage />
                  </Suspense>
                ),
              },
              {
                path: 'assistant/:conversationId',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProjectAssistantPage />
                  </Suspense>
                ),
              },
            ],
          },

          // UI09: Document Detail
          {
            path: 'documents/:documentId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DocumentDetailPage />
              </Suspense>
            ),
          },

          // UI15: KBase Guide
          {
            path: 'guide',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GuidePage />
              </Suspense>
            ),
          },

          // UI16 & UI17: Account Settings
          {
            path: 'settings/profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'settings/security',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SecurityPage />
              </Suspense>
            ),
          },

          // Admin Section (UI18, UI19, UI20)
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'admin/users',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AdminUsersPage />
                  </Suspense>
                ),
              },
              {
                path: 'admin/users/:userId',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AdminUserDetailPage />
                  </Suspense>
                ),
              },
              {
                path: 'admin/projects',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AdminProjectsPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // UI22: 404 Not Found
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
