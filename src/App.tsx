import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import Spaces from "@/pages/Spaces";
import Issues from "@/pages/Issues";
import Operations from "@/pages/Operations";
import Occupants from "@/pages/Occupants";
import RoomAssignments from "@/pages/RoomAssignments";
import Keys from "@/pages/Keys";
import Profile from "@/pages/Profile";
import Lighting from "@/pages/Lighting";
import UserDashboard from "@/pages/UserDashboard";
import MyRequests from "@/pages/MyRequests";
import MyIssues from "@/pages/MyIssues";
import AdminProfile from "@/pages/AdminProfile";
import SystemSettings from "@/pages/SystemSettings";
import VerificationPending from "@/pages/VerificationPending";
import AccessManagement from "@/pages/AccessManagement";
import ThemeSettings from "@/pages/settings/ThemeSettings";
import TwoFactorAuth from "@/pages/settings/TwoFactorAuth";
import SessionSettings from "@/pages/settings/SessionSettings";
import AdminKeyRequests from "@/pages/admin/KeyRequests";
import AdminSupplyRequests from "@/pages/admin/SupplyRequests";
import SupplyRoom from "@/pages/SupplyRoom";
import { MaintenanceDashboard } from "@/pages/MaintenanceDashboard";
import { CourtOperationsDashboard } from "@/pages/CourtOperationsDashboard";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { EnhancedThemeProvider } from "@/providers/EnhancedThemeProvider";
import SimpleDashboardProvider from "@/providers/SimpleDashboardProvider";
import { Toaster } from "@/components/ui/sonner";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleProtectedRoute } from "@/components/ModuleProtectedRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/error/AuthErrorBoundary";


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
      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/" element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/spaces" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="spaces" moduleName="Spaces Management">
              <Spaces />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/issues" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="issues" moduleName="Issues Management">
              <Issues />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/operations" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="operations" moduleName="Operations Management">
              <Operations />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="occupants" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="occupants" moduleName="Occupants Management">
              <Occupants />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="occupants/room-assignments" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="occupants" moduleName="Occupants Management">
              <RoomAssignments />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="inventory" moduleName="Inventory Management">
              <InventoryDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="keys" element={
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
        <Route path="supply-room" element={
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supply Room">
              <SupplyRoom />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="maintenance" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="maintenance" moduleName="Maintenance Management">
              <MaintenanceDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="court-operations" element={
          <ProtectedRoute requireAdmin>
            <ModuleProtectedRoute moduleKey="court_operations" moduleName="Court Operations">
              <CourtOperationsDashboard />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />


        {/* Settings Routes */}
        <Route path="settings/theme" element={
          <ProtectedRoute requireAdmin>
            <ThemeSettings />
          </ProtectedRoute>
        } />
        <Route path="settings/security/2fa" element={
          <ProtectedRoute requireAdmin>
            <TwoFactorAuth />
          </ProtectedRoute>
        } />
        <Route path="settings/security/session" element={
          <ProtectedRoute requireAdmin>
            <SessionSettings />
          </ProtectedRoute>
        } />

        {/* User Routes */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
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

        {/* Public Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="verification-pending" element={<VerificationPending />} />
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
  console.log('App: Starting application render');
  
  return (
    <ErrorBoundary onError={(error) => console.error('App: Global error caught:', error)}>
      <QueryClientProvider client={queryClient}>
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
            </SimpleDashboardProvider>
          </EnhancedThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;