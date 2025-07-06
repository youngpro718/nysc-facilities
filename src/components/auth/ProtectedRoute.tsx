
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireVerified = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, profile } = useAuth();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - isAdmin:', isAdmin);
  console.log('ProtectedRoute - isLoading:', isLoading);
  console.log('ProtectedRoute - profile:', profile);
  console.log('ProtectedRoute - requireAdmin:', requireAdmin);
  console.log('ProtectedRoute - requireVerified:', requireVerified);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render anything if not authenticated - let AuthProvider handle redirects
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if verification is required but user is pending
  if (requireVerified && profile?.verification_status === 'pending') {
    return null;
  }

  // Don't render admin routes for non-admin users
  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
