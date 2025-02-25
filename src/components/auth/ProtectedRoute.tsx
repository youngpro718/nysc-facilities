
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

      if (requireAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('access_level')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.access_level !== 'admin') {
          toast.error('Admin access required');
          navigate('/dashboard');
          return;
        }
      }

      // Check if system is in maintenance mode
      if (settings?.maintenance_mode) {
        // Get user's profile to check if they're an admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('access_level')
          .eq('id', session.user.id)
          .single();

        // If user is not an admin, redirect to maintenance page
        if (profile?.access_level !== 'admin') {
          toast.error('System is currently under maintenance');
          navigate('/maintenance');
        }
      }
    };

    checkSession();
  }, [navigate, settings, requireAdmin]);

  return <>{children}</>;
}
