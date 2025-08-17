import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import Spaces from "@/pages/Spaces";
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
import FeaturesPreview from "@/pages/FeaturesPreview";
import AccessManagement from "@/pages/AccessManagement";
import ThemeSettings from "@/pages/settings/ThemeSettings";
import SettingsPage from '@/pages/SettingsPage';
// Legacy settings pages (2FA, Session) are consolidated under Security tab
import AdminKeyRequests from "@/pages/admin/KeyRequests";
import SupplyRoom from "@/pages/SupplyRoom";
import { CourtOperationsDashboard } from "@/pages/CourtOperationsDashboard";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import { CardShowcase } from "@/components/spaces/rooms/CardShowcase";
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
import Users from "@/pages/Users";
import AdminSupplyRequests from "@/pages/admin/SupplyRequests";


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
        <Route path="/card-showcase" element={
          <ProtectedRoute requireAdmin>
            <CardShowcase />
          </ProtectedRoute>
        } />
        {/* Issues now handled by Operations page */}
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
        {/* Supply Requests now handled by Operations page */}
        <Route path="supply-room" element={
          <ProtectedRoute>
            <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supply Room">
              <SupplyRoom />
            </ModuleProtectedRoute>
          </ProtectedRoute>
        } />
        {/* Maintenance now handled by Operations page */}
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
        {/* Legacy routes redirected to canonical Security tab */}
        <Route path="settings/security/2fa" element={<Navigate to="/settings?tab=security" replace />} />
        <Route path="settings/security/session" element={<Navigate to="/settings?tab=security" replace />} />
        {/* Legacy operations routes redirected to consolidated Operations hub */}
        <Route path="issues" element={<Navigate to="/operations?tab=issues" replace />} />
        <Route path="maintenance" element={<Navigate to="/operations?tab=maintenance" replace />} />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="profile/settings" element={<Navigate to="/settings" replace />} />

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
        <Route path="features-preview" element={<FeaturesPreview />} />
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