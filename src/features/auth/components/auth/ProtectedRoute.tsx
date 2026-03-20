
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { DashboardSkeleton } from '@features/dashboard/components/dashboard/DashboardSkeleton';
import { getDashboardForRole } from '@/routes/roleBasedRouting';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSystemAdmin?: boolean;
  requireVerified?: boolean;
  allowDepartments?: string[];
  requireRoomAssignment?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSystemAdmin = false,
  requireVerified = true,
  allowDepartments = [],
  requireRoomAssignment
}: ProtectedRouteProps) {
  // Hooks must be called unconditionally at the top level
  const { isAuthenticated, isAdmin, isFacilitiesManager, isLoading, profile } = useAuth();

  // OPTIMIZATION: Show skeleton instead of spinner for better UX
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userIsAdminTier = isAdmin || isFacilitiesManager;
  const userIsSystemAdmin = isAdmin; // admin or system_admin only (from useAuth)

  // Admin-tier roles bypass verification checks (but NOT route-level guards)
  if (!userIsAdminTier) {
    // Redirect pending users to approval page
    if (requireVerified && profile?.verification_status === 'pending') {
      logger.debug('[ProtectedRoute] User pending verification, redirecting');
      return <Navigate to="/auth/pending-approval" replace />;
    }
  }

  // System-admin-only routes (AdminCenter, routing rules, form templates)
  if (requireSystemAdmin && !userIsSystemAdmin) {
    logger.debug('[ProtectedRoute] Route requires system admin, user role:', profile?.role);
    const fallback = getDashboardForRole(profile?.role);
    return <Navigate to={fallback} replace />;
  }

  // Admin-tier routes (admin dashboard, spaces admin, access assignments, etc.)
  if (requireAdmin && !userIsAdminTier) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vestigial props, not used in current routes
    const p = profile as unknown as Record<string, unknown>;
    const userDepartment = (p?.department || p?.department_id) as string | undefined;
    const hasDepartmentAccess = allowDepartments.length > 0 && userDepartment && allowDepartments.includes(userDepartment);
    const hasRoomAccess = requireRoomAssignment && Array.isArray(p?.roomAssignments) &&
      p.roomAssignments.some((a: { room_number?: string }) => a.room_number === requireRoomAssignment);
    
    if (!hasDepartmentAccess && !hasRoomAccess) {
      const fallback = getDashboardForRole(profile?.role);
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}
