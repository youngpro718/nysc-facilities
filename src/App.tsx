import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { logger } from '@/lib/logger';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { EnhancedThemeProvider } from "@/providers/EnhancedThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import RealtimeProvider from "@/providers/RealtimeProvider";
import { useConditionalNotifications } from "@shared/hooks/useConditionalNotifications";
import { AuthProvider, useAuth } from "@features/auth/hooks/useAuth";
import { ProtectedRoute } from "@features/auth/components/auth/ProtectedRoute";
import { ModuleProtectedRoute } from "@/routes/ModuleProtectedRoute";
import OnboardingGuard from "@/routes/OnboardingGuard";
import ErrorBoundary from "@shared/components/error/ErrorBoundary";
import AuthErrorBoundary from "@shared/components/error/AuthErrorBoundary";
import { InstallPrompt } from "@shared/components/pwa/InstallPrompt";
import { DevModePanel } from "@shared/components/dev/DevModePanel";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import type { UserRole } from "@/config/roles";
import { QUERY_CONFIG } from '@/config';
import { RouteSkeleton } from "@/components/ui/RouteSkeleton";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

// ── Lazy route components ─────────────────────────────────────────────────────
// Every page is loaded on demand so the initial bundle only contains providers,
// guards, and the Layout shell. Each chunk is fetched when the matching route
// is first visited.

// Auth & onboarding
const LoginPage = lazy(() => import("@features/auth/pages/LoginPage"));
const MFASetup = lazy(() => import("@features/auth/pages/auth/MFASetup"));
const VerifyEmail = lazy(() => import("@features/auth/pages/auth/VerifyEmail"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const PendingApproval = lazy(() => import("@features/auth/pages/auth/PendingApproval"));
const AccountRejected = lazy(() => import("@features/auth/pages/auth/AccountRejected"));
const ProfileOnboarding = lazy(() => import("@features/auth/pages/onboarding/ProfileOnboarding"));
const NotFound = lazy(() => import("@features/auth/pages/NotFound"));
const VerificationPending = lazy(() => import("@features/auth/pages/VerificationPending"));
const InstallApp = lazy(() => import("@features/auth/pages/InstallApp"));

// Role dashboards
const AdminDashboard = lazy(() => import("@features/admin/pages/AdminDashboard"));
const CMCDashboard = lazy(() => import("@features/court/pages/CMCDashboard"));
const CourtOfficerDashboard = lazy(() => import("@features/court/pages/CourtOfficerDashboard"));
const CourtAideWorkCenter = lazy(() => import("@features/court/pages/CourtAideWorkCenter"));
const UserDashboard = lazy(() => import("@features/dashboard/pages/UserDashboard"));

// Feature pages
const Spaces = lazy(() => import("@features/spaces/pages/Spaces"));
const Operations = lazy(() => import("@features/operations/pages/Operations"));
const AccessAssignments = lazy(() => import("@features/occupants/pages/AccessAssignments"));
const Keys = lazy(() => import("@features/keys/pages/Keys"));
const Profile = lazy(() => import("@features/profile/pages/Profile"));
const MyRequests = lazy(() => import("@features/dashboard/pages/MyRequests"));
const MyIssues = lazy(() => import("@features/issues/pages/MyIssues"));
const MySupplyRequests = lazy(() => import("@features/supply/pages/MySupplyRequests"));
const MyActivity = lazy(() => import("@features/dashboard/pages/MyActivity"));
const Tasks = lazy(() => import("@features/tasks/pages/Tasks"));
const SupplyRoom = lazy(() => import("@features/supply/pages/SupplyRoom"));
const Notifications = lazy(() => import("@features/dashboard/pages/Notifications"));
const TermSheet = lazy(() => import("@features/court/pages/TermSheet"));

// Named exports need destructuring inside the factory
const CourtOperationsDashboard = lazy(() =>
  import("@features/court/pages/CourtOperationsDashboard").then(m => ({ default: m.CourtOperationsDashboard }))
);
const InventoryDashboard = lazy(() =>
  import("@features/inventory/pages/InventoryDashboard").then(m => ({ default: m.InventoryDashboard }))
);
const LiveCourtGrid = lazy(() => import("@features/court/components/court/LiveCourtGrid"));
const HelpCenter = lazy(() =>
  import("@shared/components/help/HelpCenter").then(m => ({ default: m.HelpCenter }))
);

// Admin
const AdminCenter = lazy(() => import("@features/admin/pages/AdminCenter"));
const AdminKeyRequests = lazy(() => import("@features/admin/pages/admin/KeyRequests"));
const AdminSupplyRequests = lazy(() => import("@features/admin/pages/admin/SupplyRequests"));
const RoutingRules = lazy(() => import("@features/admin/pages/admin/RoutingRules"));
const FormTemplatesAdmin = lazy(() => import("@features/admin/pages/admin/FormTemplatesAdmin"));

// Forms
const KeyRequestFormPage = lazy(() => import("@features/forms/pages/forms/KeyRequestFormPage"));
const MaintenanceRequestFormPage = lazy(() => import("@features/forms/pages/forms/MaintenanceRequestFormPage"));
const IssueReportFormPage = lazy(() => import("@features/forms/pages/forms/IssueReportFormPage"));
const PublicForms = lazy(() => import("@features/forms/pages/PublicForms"));
const PublicFormSubmission = lazy(() => import("@features/forms/pages/PublicFormSubmission"));

// Supply request flows
const HelpRequestPage = lazy(() => import("@features/supply/pages/request/HelpRequestPage"));
const SupplyOrderPage = lazy(() => import("@features/supply/pages/request/SupplyOrderPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_CONFIG.globalRetry,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        {/* Public Routes - No Authentication Required */}
        <Route path="/public-forms" element={<PublicForms />} />
        <Route path="/submit-form" element={<PublicFormSubmission />} />

        {/* Public Interactive Form Pages - No Layout, No Auth */}
        <Route path="/forms/key-request" element={<KeyRequestFormPage />} />
        <Route path="/forms/supply-request" element={<Navigate to="/request/supplies" replace />} />
        <Route path="/forms/maintenance-request" element={<MaintenanceRequestFormPage />} />
        <Route path="/forms/issue-report" element={<IssueReportFormPage />} />

        {/* Auth Flow Pages - Outside OnboardingGuard */}
        <Route path="/auth/pending-approval" element={<PendingApproval />} />
        <Route path="/auth/account-rejected" element={<AccountRejected />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/reset" element={<ResetPasswordPage />} />
        <Route path="/auth/mfa" element={<MFASetup />} />
        <Route path="/auth/verify" element={<VerifyEmail />} />
        <Route path="/onboarding/profile" element={<ProfileOnboarding />} />
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/install" element={<InstallApp />} />

        {/* Protected Routes - Wrapped with OnboardingGuard */}
        <Route element={<OnboardingGuard><Layout /></OnboardingGuard>}>
          {/* Admin Routes */}
          <Route path="/" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Role-Specific Dashboard Routes */}
          <Route path="/cmc-dashboard" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="court_operations" moduleName="Court Management">
                <CMCDashboard />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/court-officer-dashboard" element={
            <ProtectedRoute>
              <CourtOfficerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/court-aide-dashboard" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="inventory" moduleName="Supply Management">
                <CourtAideWorkCenter />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/spaces" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="spaces" moduleName="Rooms Management">
                <Spaces />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          {/* Issues now handled by Operations page */}
          <Route path="/operations" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="operations" moduleName="Operations Management">
                <Operations />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="access-assignments" element={
            <ProtectedRoute requireAdmin>
              <ModuleProtectedRoute moduleKey="occupants" moduleName="Access & Assignments">
                <AccessAssignments />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="inventory" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="inventory" moduleName="Inventory Management">
                <InventoryDashboard />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/keys" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="keys" moduleName="Keys Management">
                <Keys />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          {/* Admin Center - Team & User Management */}
          <Route path="admin" element={
            <ProtectedRoute requireSystemAdmin>
              <AdminCenter />
            </ProtectedRoute>
          } />
          {/* System Settings merged into Admin Center */}
          <Route path="system-settings" element={<Navigate to="/admin?tab=system" replace />} />
          {/* /users route removed — use /admin instead */}
          <Route path="users" element={<Navigate to="/admin" replace />} />
          <Route path="admin/key-requests" element={
            <ProtectedRoute requireAdmin>
              <AdminKeyRequests />
            </ProtectedRoute>
          } />
          <Route path="admin/supply-requests" element={
            <ProtectedRoute requireAdmin>
              <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supply Requests">
                <AdminSupplyRequests />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          {/* /form-templates and /form-intake removed — redirect to dashboard */}
          <Route path="form-templates" element={<Navigate to="/dashboard" replace />} />
          <Route path="form-intake" element={<Navigate to="/dashboard" replace />} />
          <Route path="admin/routing-rules" element={
            <ProtectedRoute requireSystemAdmin>
              <RoutingRules />
            </ProtectedRoute>
          } />
          <Route path="admin/form-templates" element={
            <ProtectedRoute requireSystemAdmin>
              <FormTemplatesAdmin />
            </ProtectedRoute>
          } />
          {/* Tasks Management */}
          <Route path="tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="my-supply-requests" element={
            <ProtectedRoute>
              <MySupplyRequests />
            </ProtectedRoute>
          } />
          <Route path="supply-requests" element={<Navigate to="/my-supply-requests" replace />} />
          <Route path="supply-room" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supply Room">
                <SupplyRoom />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          {/* Maintenance now handled by Operations page */}
          <Route path="court-operations" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleKey="court_operations" moduleName="Court Operations">
                <CourtOperationsDashboard />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="court-live" element={
            <ProtectedRoute requireAdmin>
              <ModuleProtectedRoute moduleKey="court_operations" moduleName="Court Operations">
                <LiveCourtGrid />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />


          {/* Settings Routes */}
          {/* Theme and security sub-paths redirect to Profile settings tab */}
          <Route path="settings/theme" element={<Navigate to="/profile?tab=settings" replace />} />
          <Route path="settings/security/2fa" element={<Navigate to="/profile?tab=settings" replace />} />
          <Route path="settings/security/session" element={<Navigate to="/profile?tab=settings" replace />} />
          <Route path="profile/settings" element={<Navigate to="/profile?tab=settings" replace />} />
          {/* Legacy operations routes redirected to consolidated Operations hub */}
          <Route path="issues" element={<Navigate to="/operations?tab=issues" replace />} />
          <Route path="maintenance" element={<Navigate to="/operations?tab=maintenance" replace />} />

          {/* User Routes */}
          {/* /request redirects to dashboard — quick actions are inline via FAB */}
          <Route path="request" element={<Navigate to="/dashboard" replace />} />
          <Route path="request/help" element={
            <ProtectedRoute>
              <HelpRequestPage />
            </ProtectedRoute>
          } />
          <Route path="request/supplies" element={
            <ProtectedRoute>
              <SupplyOrderPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          {/* Unified My Activity page */}
          <Route path="my-activity" element={
            <ProtectedRoute>
              <MyActivity />
            </ProtectedRoute>
          } />
          {/* Legacy routes - keep for backwards compatibility */}
          <Route path="my-requests" element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="my-issues" element={
            <ProtectedRoute>
              <MyIssues />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="term-sheet" element={
            <ProtectedRoute>
              <TermSheet />
            </ProtectedRoute>
          } />
          {/* Help Center */}
          <Route path="help" element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function NotificationsWrapper({ children }: { children: React.ReactNode }) {
  // Initialize realtime notifications (both user and admin) - now safely inside AuthProvider
  useConditionalNotifications();
  return <>{children}</>;
}

// DevMode wrapper - renders panel only for real admins
function DevModeWrapper() {
  const { isAdmin } = useAuth();
  const { userRole } = useRolePermissions();

  // Only show DevModePanel for actual admins (not preview admins)
  // We need the real role from the database, which we get by checking if preview is active
  const previewRole = typeof window !== 'undefined' ? localStorage.getItem('preview_role') : null;
  const realRole = previewRole && isAdmin ? 'admin' : (userRole as UserRole);

  // Only render for actual admins
  if (!isAdmin) return null;

  return <DevModePanel realRole="admin" />;
}

function App() {
  return (
    <ErrorBoundary onError={(error) => logger.error('App: Global error caught:', error)}>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <EnhancedThemeProvider>
            <BrowserRouter>
                  <AuthErrorBoundary onError={(error) => logger.error('App: Auth error caught:', error)}>
                    <AuthProvider>
                      <NotificationsWrapper>
                        <TopProgressBar />
                        <AppContent />
                        <DevModeWrapper />
                      </NotificationsWrapper>
                    </AuthProvider>
                  </AuthErrorBoundary>
                  <Toaster />
                  <InstallPrompt />
            </BrowserRouter>
          </EnhancedThemeProvider>
        </RealtimeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
