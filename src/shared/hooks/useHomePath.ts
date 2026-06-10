import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDashboardForRole } from '@/routes/roleBasedRouting';

/**
 * Returns the role-aware home path for the current user.
 * Admin/system_admin/facilities_manager => "/", others => their role dashboard.
 */
export function useHomePath(): string {
  const { profile } = useAuth();
  return getDashboardForRole(profile?.role);
}

/**
 * Returns a stable callback that navigates to the user's role-aware home,
 * replacing the current entry so the browser's forward button does not
 * re-enter the page they just left.
 */
export function useGoHome(): () => void {
  const navigate = useNavigate();
  const home = useHomePath();
  return useCallback(() => {
    navigate(home, { replace: true });
  }, [navigate, home]);
}
