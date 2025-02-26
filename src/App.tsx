import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/pages/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import Spaces from "@/pages/Spaces";
import Issues from "@/pages/Issues";
import Occupants from "@/pages/Occupants";
import Keys from "@/pages/Keys";
import Profile from "@/pages/Profile";
import Lighting from "@/pages/Lighting";
import UserDashboard from "@/pages/UserDashboard";
import AdminProfile from "@/pages/AdminProfile";
import VerificationPending from "@/pages/VerificationPending";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
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

                {/* User Routes */}
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
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
