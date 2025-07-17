
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
  allowDepartments?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireVerified = true,
  allowDepartments = []
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, profile } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render anything if not authenticated - auth provider handles redirects
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if verification is required but user is pending
  if (requireVerified && profile?.verification_status === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render admin routes for non-admin users, unless they're in allowed departments
  if (requireAdmin && !isAdmin) {
    const userDepartment = (profile as any)?.department;
    const hasDepartmentAccess = allowDepartments.length > 0 && userDepartment && allowDepartments.includes(userDepartment);
    
    if (!hasDepartmentAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
