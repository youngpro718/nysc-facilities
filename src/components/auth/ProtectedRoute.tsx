
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate();

  // Check maintenance mode status
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'general_settings')
        .single();

      if (error) throw error;
      return data?.value as { maintenance_mode: boolean } | null;
    }
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Get user's role to check if they're an admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        toast.error('Error checking permissions');
        navigate('/login');
        return;
      }

      // If requireAdmin is true and user doesn't have admin role, redirect to dashboard
      if (requireAdmin && (!roleData || roleData.role !== 'admin')) {
        toast.error('You do not have permission to access this page');
        navigate('/dashboard');
        return;
      }

      // Check if system is in maintenance mode
      if (settings?.maintenance_mode) {
        // If user is not an admin, redirect to maintenance page
        if (!roleData || roleData.role !== 'admin') {
          toast.error('System is currently under maintenance');
          navigate('/maintenance');
        }
      }
    };

    checkSession();
  }, [navigate, settings, requireAdmin]);

  return <>{children}</>;
}
