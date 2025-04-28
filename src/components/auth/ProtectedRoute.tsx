
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

    // Handle verification pending
    if (requireVerified && profile?.verification_status === 'pending') {
      navigate('/verification-pending', { replace: true });
      return;
    }

    // Handle admin route protection
    if (requireAdmin && !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    profile, 
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
