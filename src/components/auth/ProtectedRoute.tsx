import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerified && profile?.verification_status === 'pending') {
    return <Navigate to="/verification-pending" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 