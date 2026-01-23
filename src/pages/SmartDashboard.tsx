/**
 * SMART DASHBOARD - Role-Adaptive Dashboard
 * 
 * A single dashboard that adapts its content based on user role:
 * - Admin: Full facility overview, all modules
 * - CMC: Court operations focus
 * - Court Aide: Supply fulfillment focus
 * - Standard User: Personal requests and issues
 * 
 * This replaces the need for multiple separate dashboard pages.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";

// Import dashboards
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import RoleDashboard from "@/pages/RoleDashboard";

import { Loader2 } from "lucide-react";

/**
 * SmartDashboard automatically renders the appropriate dashboard
 * based on the user's role. This provides a single entry point
 * while maintaining role-specific experiences.
 */
export default function SmartDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Show loading while determining role
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Render role-specific dashboard
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    
    case 'cmc':
    case 'court_aide':
      return <RoleDashboard />;
    
    default:
      // Standard users and any unrecognized roles
      return <UserDashboard />;
  }
}

/**
 * Hook to get the appropriate dashboard path for a role
 * Useful for navigation and redirects
 */
export function useDashboardPath() {
  const { userRole } = useRolePermissions();
  
  switch (userRole) {
    case 'admin':
      return '/';
    case 'cmc':
      return '/cmc-dashboard';
    case 'court_aide':
      return '/court-aide-dashboard';
    default:
      return '/dashboard';
  }
}
