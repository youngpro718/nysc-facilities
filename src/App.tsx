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
import Relocations from "@/pages/Relocations";
import CreateRelocation from "@/pages/CreateRelocation";
import TermSchedule from "@/pages/TermSchedule";
import { Component, ErrorInfo, ReactNode } from "react";

// Error boundary component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md p-8 rounded-lg bg-card shadow-lg">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
                  <Route path="relocations" element={
                    <ProtectedRoute requireAdmin>
                      <Relocations />
                    </ProtectedRoute>
                  } />
                  <Route path="relocations/create" element={
                    <ProtectedRoute requireAdmin>
                      <CreateRelocation />
                    </ProtectedRoute>
                  } />
                  <Route path="relocations/:id" element={
                    <ProtectedRoute requireAdmin>
                      <CreateRelocation />
                    </ProtectedRoute>
                  } />
                  <Route path="court-terms" element={
                    <ProtectedRoute requireAdmin>
                      <TermSchedule />
                    </ProtectedRoute>
                  } />
                  <Route path="court-terms/create" element={
                    <ProtectedRoute requireAdmin>
                      <TermSchedule />
                    </ProtectedRoute>
                  } />
                  <Route path="court-terms/:id/edit" element={
                    <ProtectedRoute requireAdmin>
                      <TermSchedule />
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
    </ErrorBoundary>
  );
}

export default App;
