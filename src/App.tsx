import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { logger } from '@/lib/logger';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@features/admin/pages/AdminDashboard";
import CMCDashboard from "@features/court/pages/CMCDashboard";
import CourtOfficerDashboard from "@features/court/pages/CourtOfficerDashboard";
import CourtAideWorkCenter from "@features/court/pages/CourtAideWorkCenter";
import RoleDashboard from "@features/dashboard/pages/RoleDashboard";
import LoginPage from "@features/auth/pages/LoginPage";
import MFASetup from "@features/auth/pages/auth/MFASetup";
import VerifyEmail from "@features/auth/pages/auth/VerifyEmail";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PendingApproval from "@features/auth/pages/auth/PendingApproval";
import AccountRejected from "@features/auth/pages/auth/AccountRejected";
import ProfileOnboarding from "@features/auth/pages/onboarding/ProfileOnboarding";
import NotFound from "@features/auth/pages/NotFound";
import Spaces from "@features/spaces/pages/Spaces";
import Operations from "@features/operations/pages/Operations";
import AccessAssignments from "@features/occupants/pages/AccessAssignments";

import Keys from "@features/keys/pages/Keys";
import Profile from "@features/profile/pages/Profile";
import UserDashboard from "@features/dashboard/pages/UserDashboard";
import MyRequests from "@features/dashboard/pages/MyRequests";
import MyIssues from "@features/issues/pages/MyIssues";
import MySupplyRequests from "@features/supply/pages/MySupplyRequests";
import MyActivity from "@features/dashboard/pages/MyActivity";
import Tasks from "@features/tasks/pages/Tasks";
import AdminCenter from "@features/admin/pages/AdminCenter";
// SystemSettings merged into AdminCenter
import VerificationPending from "@features/auth/pages/VerificationPending";
// FeaturesPreview removed — was disconnected placeholder content
// AccessManagement page removed — functionality merged into /access-assignments
// ThemeSettings and SettingsPage removed - consolidated into Profile
import AdminKeyRequests from "@features/admin/pages/admin/KeyRequests";
import SupplyRoom from "@features/supply/pages/SupplyRoom";
import { CourtOperationsDashboard } from "@features/court/pages/CourtOperationsDashboard";
import { InventoryDashboard } from "@features/inventory/pages/InventoryDashboard";
import LiveCourtGrid from "@features/court/components/court/LiveCourtGrid";
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
// Users page removed — consolidated into AdminCenter (/admin)
import AdminSupplyRequests from "@features/admin/pages/admin/SupplyRequests";
import Notifications from "@features/dashboard/pages/Notifications";
import { InstallPrompt } from "@shared/components/pwa/InstallPrompt";
import InstallApp from "@features/auth/pages/InstallApp";
// FormIntake and FormTemplates removed — dead routes with no navigation entry
// import FormIntake from "@features/forms/pages/FormIntake";
// import FormTemplates from "@features/forms/pages/FormTemplates";
import RoutingRules from "@features/admin/pages/admin/RoutingRules";
import FormTemplatesAdmin from "@features/admin/pages/admin/FormTemplatesAdmin";
import KeyRequestFormPage from "@features/forms/pages/forms/KeyRequestFormPage";
// SupplyRequestFormPage removed - now redirects to /request/supplies
import MaintenanceRequestFormPage from "@features/forms/pages/forms/MaintenanceRequestFormPage";
import IssueReportFormPage from "@features/forms/pages/forms/IssueReportFormPage";
import PublicForms from "@features/forms/pages/PublicForms";
import PublicFormSubmission from "@features/forms/pages/PublicFormSubmission";
import TermSheet from "@features/court/pages/TermSheet";
import HelpRequestPage from "@features/supply/pages/request/HelpRequestPage";
import SupplyOrderPage from "@features/supply/pages/request/SupplyOrderPage";
import { DevModePanel } from "@shared/components/dev/DevModePanel";
import { HelpCenter } from "@shared/components/help/HelpCenter";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import type { UserRole } from "@/config/roles";
import { QUERY_CONFIG } from '@/config';


// Create a client
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
            <ModuleProtectedRoute moduleKey="spaces" moduleName="Spaces Management">
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