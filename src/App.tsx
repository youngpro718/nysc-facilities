import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import Spaces from "@/pages/Spaces";
import Issues from "@/pages/Issues";
import Occupants from "@/pages/Occupants";
import RoomAssignments from "@/pages/RoomAssignments";
import Keys from "@/pages/Keys";
import Profile from "@/pages/Profile";
import Lighting from "@/pages/Lighting";
import UserDashboard from "@/pages/UserDashboard";
import MyRequests from "@/pages/MyRequests";
import MyIssues from "@/pages/MyIssues";
import AdminProfile from "@/pages/AdminProfile";
import VerificationPending from "@/pages/VerificationPending";
import AccessManagement from "@/pages/AccessManagement";
import ThemeSettings from "@/pages/settings/ThemeSettings";
import TwoFactorAuth from "@/pages/settings/TwoFactorAuth";
import SessionSettings from "@/pages/settings/SessionSettings";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<Layout />}>
                {/* Admin Routes */}
                <Route path="/" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="spaces" element={
                  <ProtectedRoute requireAdmin>
                    <Spaces />
                  </ProtectedRoute>
                } />
                <Route path="issues" element={
                  <ProtectedRoute requireAdmin>
                    <Issues />
                  </ProtectedRoute>
                } />
                <Route path="occupants" element={
                  <ProtectedRoute requireAdmin>
                    <Occupants />
                  </ProtectedRoute>
                } />
                <Route path="occupants/room-assignments" element={
                  <ProtectedRoute requireAdmin>
                    <RoomAssignments />
                  </ProtectedRoute>
                } />
                <Route path="keys" element={
                  <ProtectedRoute requireAdmin>
                    <Keys />
                  </ProtectedRoute>
                } />
                <Route path="lighting" element={
                  <ProtectedRoute requireAdmin>
                    <Lighting />
                  </ProtectedRoute>
                } />
                <Route path="admin-profile" element={
                  <ProtectedRoute requireAdmin>
                    <AdminProfile />
                  </ProtectedRoute>
                } />
                <Route path="access-management" element={
                  <ProtectedRoute requireAdmin>
                    <AccessManagement />
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
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
