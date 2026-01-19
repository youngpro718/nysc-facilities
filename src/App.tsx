import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import RoleDashboard from "@/pages/RoleDashboard";
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
import AdminProfile from "@/pages/AdminProfile";
import SystemSettings from "@/pages/SystemSettings";
import VerificationPending from "@/pages/VerificationPending";
import FeaturesPreview from "@/pages/FeaturesPreview";
import AccessManagement from "@/pages/AccessManagement";
import ThemeSettings from "@/pages/settings/ThemeSettings";
import SettingsPage from '@/pages/SettingsPage';
// Legacy settings pages (2FA, Session) are consolidated under Security tab
import AdminKeyRequests from "@/pages/admin/KeyRequests";
import SupplyRoom from "@/pages/SupplyRoom";
import { CourtOperationsDashboard } from "@/pages/CourtOperationsDashboard";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import LiveCourtGrid from "@/components/court/LiveCourtGrid";
import { CardShowcase } from "@/components/spaces/rooms/CardShowcase";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { EnhancedThemeProvider } from "@/providers/EnhancedThemeProvider";
import SimpleDashboardProvider from "@/providers/SimpleDashboardProvider";
import { Toaster } from "@/components/ui/sonner";
import RealtimeProvider from "@/providers/RealtimeProvider";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleProtectedRoute } from "@/components/ModuleProtectedRoute";
import OnboardingGuard from "@/routes/OnboardingGuard";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/error/AuthErrorBoundary";
import Users from "@/pages/Users";
import AdminSupplyRequests from "@/pages/admin/SupplyRequests";
import Notifications from "@/pages/Notifications";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import InstallApp from "@/pages/InstallApp";
import FormIntake from "@/pages/FormIntake";
import FormTemplates from "@/pages/FormTemplates";
import RoutingRules from "@/pages/admin/RoutingRules";
import FormTemplatesAdmin from "@/pages/admin/FormTemplatesAdmin";
import KeyRequestFormPage from "@/pages/forms/KeyRequestFormPage";
import SupplyRequestFormPage from "@/pages/forms/SupplyRequestFormPage";
import MaintenanceRequestFormPage from "@/pages/forms/MaintenanceRequestFormPage";
import IssueReportFormPage from "@/pages/forms/IssueReportFormPage";
import PublicForms from "@/pages/PublicForms";
import PublicFormSubmission from "@/pages/PublicFormSubmission";
import TermSheet from "@/pages/TermSheet";


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
      <Route path="/forms/supply-request" element={<SupplyRequestFormPage />} />
      <Route path="/forms/maintenance-request" element={<MaintenanceRequestFormPage />} />
      <Route path="/forms/issue-report" element={<IssueReportFormPage />} />
      
      {/* Auth Flow Pages - Outside OnboardingGuard */}
      <Route path="/auth/pending-approval" element={<PendingApproval />} />
      <Route path="/auth/account-rejected" element={<AccountRejected />} />
      
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
        <Route path="/court-aide-dashboard" element={
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="inventory" moduleName="Supply Management">
              <RoleDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/purchasing-dashboard" element={
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="inventory" moduleName="Purchasing">
              <RoleDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />

        <Route path="/spaces" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="spaces" moduleName="Spaces Management">
              <Spaces />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/card-showcase" element={
          <ProtectedRoute requireAdmin>
            <CardShowcase />
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
        {/* Legacy routes - redirect to new Access & Assignments */}
        <Route path="occupants" element={<Navigate to="/access-assignments" replace />} />
        <Route path="occupants/room-assignments" element={<Navigate to="/access-assignments" replace />} />
        <Route path="inventory" element={
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="inventory" moduleName="Inventory Management">
              <InventoryDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/keys" element={
          <ProtectedRoute requireAdmin>
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
        <Route path="admin-profile" element={
          <ProtectedRoute requireAdmin>
            <AdminProfile />
          </ProtectedRoute>
        } />
        <Route path="system-settings" element={
          <ProtectedRoute requireAdmin>
            <SystemSettings />
          </ProtectedRoute>
        } />
        <Route path="access-management" element={
          <ProtectedRoute requireAdmin>
            <AccessManagement />
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
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supply Requests">
              <AdminSupplyRequests />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute requireAdmin>
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
        {/* Legacy Supply Routes */}
        <Route path="supplies" element={<Navigate to="/tasks" replace />} />
        <Route path="supply-requests" element={<Navigate to="/my-activity" replace />} />
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
        <Route path="settings/theme" element={
          <ProtectedRoute requireAdmin>
            <ThemeSettings />
          </ProtectedRoute>
        } />
        {/* Legacy routes redirected to Profile settings tab */}
        <Route path="settings/security/2fa" element={<Navigate to="/profile?tab=settings" replace />} />
        <Route path="settings/security/session" element={<Navigate to="/profile?tab=settings" replace />} />
        {/* Legacy operations routes redirected to consolidated Operations hub */}
        <Route path="issues" element={<Navigate to="/operations?tab=issues" replace />} />
        <Route path="maintenance" element={<Navigate to="/operations?tab=maintenance" replace />} />
        {/* Settings now consolidated into Profile page */}
        <Route path="settings" element={<Navigate to="/profile?tab=settings" replace />} />
        <Route path="profile/settings" element={<Navigate to="/profile?tab=settings" replace />} />

        {/* User Routes */}
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

        {/* Public Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/mfa" element={<MFASetup />} />
        <Route path="auth/verify" element={<VerifyEmail />} />
        <Route path="onboarding/profile" element={<ProfileOnboarding />} />
        <Route path="verification-pending" element={<VerificationPending />} />
        <Route path="features-preview" element={<FeaturesPreview />} />
        <Route path="install" element={<InstallApp />} />
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

function App() {
  return (
    <ErrorBoundary onError={(error) => console.error('App: Global error caught:', error)}>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <ThemeProvider>
            <EnhancedThemeProvider>
              <SimpleDashboardProvider>
                <BrowserRouter>
                  <AuthErrorBoundary onError={(error) => console.error('App: Auth error caught:', error)}>
                    <AuthProvider>
                      <NotificationsWrapper>
                        <AppContent />
                      </NotificationsWrapper>
                    </AuthProvider>
                  </AuthErrorBoundary>
                </BrowserRouter>
                <Toaster />
                <InstallPrompt />
              </SimpleDashboardProvider>
            </EnhancedThemeProvider>
          </ThemeProvider>
        </RealtimeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;