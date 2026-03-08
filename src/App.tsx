import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { logger } from '@/lib/logger';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import RoleDashboard from "@/pages/RoleDashboard";
import CourtAideWorkCenter from "@/pages/CourtAideWorkCenter";
import LoginPage from "@/pages/LoginPage";
import MFASetup from "@/pages/auth/MFASetup";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import PendingApproval from "@/pages/auth/PendingApproval";
import AccountRejected from "@/pages/auth/AccountRejected";
import ProfileOnboarding from "@/pages/onboarding/ProfileOnboarding";
import NotFound from "@/pages/NotFound";
import Spaces from "@/pages/Spaces";
import Operations from "@/pages/Operations";
import AccessAssignments from "@/pages/AccessAssignments";

import Keys from "@/pages/Keys";
import Profile from "@/pages/Profile";
import Lighting from "@/pages/Lighting";
import UserDashboard from "@/pages/UserDashboard";
import MyRequests from "@/pages/MyRequests";
import MyIssues from "@/pages/MyIssues";
import MySupplyRequests from "@/pages/MySupplyRequests";
import MyActivity from "@/pages/MyActivity";
import Tasks from "@/pages/Tasks";
import AdminCenter from "@/pages/AdminCenter";
import SystemSettings from "@/pages/SystemSettings";
import VerificationPending from "@/pages/VerificationPending";
import FeaturesPreview from "@/pages/FeaturesPreview";
// AccessManagement page removed — functionality merged into /access-assignments
// ThemeSettings and SettingsPage removed - consolidated into Profile
import AdminKeyRequests from "@/pages/admin/KeyRequests";
import SupplyRoom from "@/pages/SupplyRoom";
import { CourtOperationsDashboard } from "@/pages/CourtOperationsDashboard";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import LiveCourtGrid from "@/components/court/LiveCourtGrid";
import { EnhancedThemeProvider } from "@/providers/EnhancedThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import RealtimeProvider from "@/providers/RealtimeProvider";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleProtectedRoute } from "@/components/ModuleProtectedRoute";
import OnboardingGuard from "@/routes/OnboardingGuard";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/error/AuthErrorBoundary";
// Users page removed — consolidated into AdminCenter (/admin)
import AdminSupplyRequests from "@/pages/admin/SupplyRequests";
import Notifications from "@/pages/Notifications";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import InstallApp from "@/pages/InstallApp";
// FormIntake and FormTemplates removed — dead routes with no navigation entry
// import FormIntake from "@/pages/FormIntake";
// import FormTemplates from "@/pages/FormTemplates";
import RoutingRules from "@/pages/admin/RoutingRules";
import FormTemplatesAdmin from "@/pages/admin/FormTemplatesAdmin";
import KeyRequestFormPage from "@/pages/forms/KeyRequestFormPage";
// SupplyRequestFormPage removed - now redirects to /request/supplies
import MaintenanceRequestFormPage from "@/pages/forms/MaintenanceRequestFormPage";
import IssueReportFormPage from "@/pages/forms/IssueReportFormPage";
import PublicForms from "@/pages/PublicForms";
import PublicFormSubmission from "@/pages/PublicFormSubmission";
import TermSheet from "@/pages/TermSheet";
import RequestHub from "@/pages/RequestHub";
import HelpRequestPage from "@/pages/request/HelpRequestPage";
import SupplyOrderPage from "@/pages/request/SupplyOrderPage";
import { DevModePanel } from "@/components/dev/DevModePanel";
import { HelpCenter } from "@/components/help/HelpCenter";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import type { UserRole } from "@/config/roles";


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
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
      <Route path="/auth/mfa" element={<MFASetup />} />
      <Route path="/auth/verify" element={<VerifyEmail />} />
      <Route path="/onboarding/profile" element={<ProfileOnboarding />} />
      <Route path="/verification-pending" element={<VerificationPending />} />
      <Route path="/features-preview" element={<FeaturesPreview />} />
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
              <RoleDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/court-officer-dashboard" element={
          <ProtectedRoute>
            <RoleDashboard />
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
        <Route path="lighting" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="lighting" moduleName="Lighting Management">
              <Lighting />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        {/* Admin Center - Team & User Management */}
        <Route path="admin" element={
          <ProtectedRoute requireAdmin>
            <AdminCenter />
          </ProtectedRoute>
        } />
        <Route path="system-settings" element={
          <ProtectedRoute requireAdmin>
            <SystemSettings />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute requireAdmin>
            <Users />
          </ProtectedRoute>
        } />
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
        <Route path="form-templates" element={
          <ProtectedRoute>
            <FormTemplates />
          </ProtectedRoute>
        } />
        <Route path="form-intake" element={
          <ProtectedRoute>
            <FormIntake />
          </ProtectedRoute>
        } />
        <Route path="admin/routing-rules" element={
          <ProtectedRoute requireAdmin>
            <RoutingRules />
          </ProtectedRoute>
        } />
        <Route path="admin/form-templates" element={
          <ProtectedRoute requireAdmin>
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
        <Route path="request" element={
          <ProtectedRoute>
            <RequestHub />
          </ProtectedRoute>
        } />
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
                        {import.meta.env.DEV && <DevModeWrapper />}
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