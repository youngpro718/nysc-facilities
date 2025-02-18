
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Create a client
const queryClient = new QueryClient();

// Admin routes protection component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsAdmin(roleData?.role === 'admin');
    };

    checkAdminStatus();
  }, []);

  // Show nothing while checking
  if (isAdmin === null) {
    return null;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// User routes protection component
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsAdmin(roleData?.role === 'admin');
    };

    checkAdminStatus();
  }, []);

  // Show nothing while checking
  if (isAdmin === null) {
    return null;
  }

  // Redirect to admin dashboard if admin
  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Admin Routes */}
              <Route path="/" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="spaces" element={
                <AdminRoute>
                  <Spaces />
                </AdminRoute>
              } />
              <Route path="issues" element={
                <AdminRoute>
                  <Issues />
                </AdminRoute>
              } />
              <Route path="occupants" element={
                <AdminRoute>
                  <Occupants />
                </AdminRoute>
              } />
              <Route path="keys" element={
                <AdminRoute>
                  <Keys />
                </AdminRoute>
              } />
              <Route path="lighting" element={
                <AdminRoute>
                  <Lighting />
                </AdminRoute>
              } />
              <Route path="admin-profile" element={
                <AdminRoute>
                  <AdminProfile />
                </AdminRoute>
              } />

              {/* User Routes */}
              <Route path="dashboard" element={
                <UserRoute>
                  <UserDashboard />
                </UserRoute>
              } />
              <Route path="profile" element={
                <UserRoute>
                  <Profile />
                </UserRoute>
              } />

              {/* Public Routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="verification-pending" element={<VerificationPending />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
