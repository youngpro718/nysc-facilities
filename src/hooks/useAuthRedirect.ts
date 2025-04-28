
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRedirectOptions {
  /**
   * Whether to redirect to auth-protected pages
   */
  enabled?: boolean;
  /**
   * Whether admin access is required for the current route
   */
  requiresAdmin?: boolean;
}

/**
 * Hook to handle authentication-based redirects
 */
export function useAuthRedirect(options: AuthRedirectOptions = {}) {
  const { enabled = true, requiresAdmin = false } = options;
  const { isAuthenticated, isAdmin, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled || isLoading) return;

    // Handle redirects based on authentication state
    if (!isAuthenticated) {
      // Save the attempted URL for redirecting after login
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }

    // Handle verification pending
    if (profile?.verification_status === 'pending') {
      navigate('/verification-pending', { replace: true });
      return;
    }

    // Handle admin route protection
    if (requiresAdmin && !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Redirect admin from user dashboard
    if (!requiresAdmin && isAdmin && location.pathname === '/dashboard') {
      navigate('/', { replace: true });
      return;
    }
    
    // If user is on login and already authenticated, redirect
    if (location.pathname === '/login' && isAuthenticated) {
      const from = location.state?.from?.pathname || (isAdmin ? '/' : '/dashboard');
      navigate(from, { replace: true });
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, profile, navigate, location, enabled, requiresAdmin]);

  return { isLoading, isAuthenticated, isAdmin, profile };
}
