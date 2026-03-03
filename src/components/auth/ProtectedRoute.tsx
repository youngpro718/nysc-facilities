
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { isAdminRole, getDashboardForRole } from '@/utils/roleBasedRouting';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
  allowDepartments?: string[];
  requireRoomAssignment?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireVerified = true,
  allowDepartments = [],
  requireRoomAssignment
}: ProtectedRouteProps) {
  // Hooks must be called unconditionally at the top level
  const { isAuthenticated, isAdmin, isLoading, profile } = useAuth();

  // SECURITY: Authentication guard removed - no bypasses allowed in production

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

  // Admins bypass verification checks
  if (isAdminRole(profile?.role)) {
    logger.debug('[ProtectedRoute] Admin user, granting access');
    return <>{children}</>;
  }

  // Redirect pending users to approval page
  if (requireVerified && profile?.verification_status === 'pending') {
    logger.debug('[ProtectedRoute] User pending verification, redirecting');
    return <Navigate to="/auth/pending-approval" replace />;
  }

  // Don't render admin routes for non-admin users, unless they're in allowed departments or have required room assignment
  if (requireAdmin && !isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vestigial props, not used in current routes
    const p = profile as unknown as Record<string, unknown>;
    const userDepartment = (p?.department || p?.department_id) as string | undefined;
    const hasDepartmentAccess = allowDepartments.length > 0 && userDepartment && allowDepartments.includes(userDepartment);
    const hasRoomAccess = requireRoomAssignment && Array.isArray(p?.roomAssignments) &&
      p.roomAssignments.some((a: { room_number?: string }) => a.room_number === requireRoomAssignment);
    
    if (!hasDepartmentAccess && !hasRoomAccess) {
      // Redirect non-admin users to their role-appropriate dashboard
      const fallback = getDashboardForRole(profile?.role);
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}
