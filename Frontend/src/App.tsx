import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore, applyTheme } from "@/stores/ui-store";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth";

// Layouts - Load immediately (critical)
import { DashboardLayout, AdminLayout } from "@/layouts";

// Auth Pages - Load immediately (landing pages)
import {
  LoginPage,
  AdminLoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "@/pages/auth";

// Public Pages - Load immediately
import HomePage from "@/pages/home";

// Error Pages - Load immediately
import NotFoundPage from "@/pages/404";
import UnauthorizedPage from "@/pages/403";

// Dashboard Pages - Lazy load (code split)
const DashboardOverview = lazy(() => import("@/pages/dashboard/overview"));
const ProfilePage = lazy(() => import("@/pages/dashboard/profile"));
const SettingsPage = lazy(() => import("@/pages/dashboard/settings"));
const OrganizationsPage = lazy(() => import("@/pages/dashboard/organizations"));
const PaymentsPage = lazy(() => import("@/pages/dashboard/payments"));
const FilesPage = lazy(() => import("@/pages/dashboard/files"));

// Admin Pages - Lazy load (code split)
const AdminOverview = lazy(() => import("@/pages/admin/overview"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AuditLogsPage = lazy(() => import("@/pages/admin/audit-logs"));
const RolesPage = lazy(() => import("@/pages/admin/roles"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-100">
      <Spinner size="lg" />
    </div>
  );
}

// Full page loading component
function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Spinner size="lg" />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  // Wait for auth state to be initialized from storage
  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is verified
  if (user && !user.emailVerified) {
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(user.email)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isInitialized } = useAuthStore();

  // Wait for auth state to be initialized from storage
  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Wait for auth state to be initialized from storage
  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const theme = useUIStore((state) => state.theme);

  // Validate authentication on mount and keep user data fresh
  // Auto-logout if token is expired or invalid
  useCurrentUser();

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <AdminLoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardOverview />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="organizations"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrganizationsPage />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentsPage />
              </Suspense>
            }
          />
          <Route
            path="files"
            element={
              <Suspense fallback={<PageLoader />}>
                <FilesPage />
              </Suspense>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminOverview />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminUsersPage />
              </Suspense>
            }
          />
          <Route
            path="audit-logs"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuditLogsPage />
              </Suspense>
            }
          />
          <Route
            path="roles"
            element={
              <Suspense fallback={<PageLoader />}>
                <RolesPage />
              </Suspense>
            }
          />
        </Route>

        {/* Error Pages */}
        <Route path="/403" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Catch all - redirect to 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
