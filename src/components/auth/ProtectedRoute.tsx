
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only process redirects when not loading and auth state is determined
    if (isLoading) return;

    // Check authentication first
    if (!isAuthenticated) {
      // Only redirect to login if not already on login page
      if (location.pathname !== '/login') {
        navigate('/login', { 
          state: { from: location.pathname }, 
          replace: true 
        });
      }
      return;
    }

    // Handle verification pending status
    if (requireVerified && profile?.verification_status === 'pending') {
      if (location.pathname !== '/verification-pending') {
        navigate('/verification-pending', { replace: true });
      }
      return;
    }

    // Handle admin-only routes
    if (requireAdmin && !isAdmin) {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true });
      }
      return;
    }
  }, [
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    profile?.verification_status,
    location.pathname, 
    requireAdmin, 
    requireVerified
  ]); // Remove navigate from dependencies to prevent loops

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
