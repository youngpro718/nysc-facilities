
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

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

  // Don't render anything if not authenticated - auth provider handles redirects
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Admins bypass verification checks
  if (profile?.access_level === 'admin') {
    console.log('[ProtectedRoute] Admin user detected, granting access');
    return <>{children}</>;
  }

  // Don't render if verification is required but user is pending
  if (requireVerified && profile?.verification_status === 'pending') {
    console.log('[ProtectedRoute] Blocking route - verification required:', {
      verification_status: profile?.verification_status,
      is_approved: profile?.is_approved,
      access_level: profile?.access_level,
      requireVerified
    });
    return (
      <div className="container mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Don't render admin routes for non-admin users, unless they're in allowed departments or have required room assignment
  if (requireAdmin && !isAdmin) {
    const userDepartment = (profile as any)?.department;
    const hasDepartmentAccess = allowDepartments.length > 0 && userDepartment && allowDepartments.includes(userDepartment);
    const hasRoomAccess = requireRoomAssignment && (profile as any)?.roomAssignments?.some((assignment: any) => 
      assignment.room_number === requireRoomAssignment
    );
    
    if (!hasDepartmentAccess && !hasRoomAccess) {
      return (
        <div className="container mx-auto p-6">
          <DashboardSkeleton />
        </div>
      );
    }
  }

  return <>{children}</>;
}
