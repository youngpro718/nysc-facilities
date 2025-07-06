
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
    if (isLoading) return;

    if (!isAuthenticated) {
      // Save the attempted URL for redirecting after login
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      });
      return;
    }

    // Handle verification pending - only redirect if currently on a protected route
    if (requireVerified && profile?.verification_status === 'pending' && location.pathname !== '/verification-pending') {
      navigate('/verification-pending', { replace: true });
      return;
    }

    // Handle admin route protection - only redirect if access is actually denied
    if (requireAdmin && !isAdmin && location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    profile?.verification_status, // Only watch verification_status specifically
    navigate, 
    location.pathname, 
    requireAdmin, 
    requireVerified
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
