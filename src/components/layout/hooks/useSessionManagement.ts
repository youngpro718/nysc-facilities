
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";
import { toast } from "sonner";

export const useSessionManagement = (isAuthPage: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const getCurrentDeviceInfo = (): DeviceInfo => ({
    name: navigator.userAgent.split('/')[0],
    platform: navigator.platform,
    language: navigator.language,
  });

  const findExistingSession = async (userId: string) => {
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data;
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          if (!isAuthPage) {
            navigate('/auth');
          }
          setIsLoading(false);
          return;
        }

        if (!session) {
          if (!isAuthPage) {
            navigate('/auth');
          }
          setIsLoading(false);
          return;
        }

        try {
          // First check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (!profile) {
            // Profile doesn't exist yet - this can happen right after signup
            // Wait a brief moment and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (retryError || !retryProfile) {
              throw new Error('Profile creation failed');
            }

            if (retryProfile.verification_status === 'pending' && location.pathname !== '/verification-pending') {
              navigate('/verification-pending');
              setIsLoading(false);
              return;
            }
          } else if (profile.verification_status === 'pending' && location.pathname !== '/verification-pending') {
            navigate('/verification-pending');
            setIsLoading(false);
            return;
          }

          // Refresh session to ensure token is valid
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw refreshError;
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!mounted) return;

          const userIsAdmin = roleData?.role === 'admin';
          setIsAdmin(userIsAdmin);

          // Handle auth page redirects
          if (isAuthPage) {
            const targetPath = userIsAdmin ? '/' : '/dashboard';
            if (location.pathname !== targetPath) {
              navigate(targetPath);
            }
            setIsLoading(false);
            return;
          }

          // Handle non-auth page access
          const currentPath = location.pathname;
          if (!userIsAdmin && currentPath === '/') {
            navigate('/dashboard');
            setIsLoading(false);
            return;
          }

          const deviceInfo = getCurrentDeviceInfo();

          try {
            const existingSession = await findExistingSession(session.user.id);

            if (existingSession?.id) {
              await supabase
                .from('user_sessions')
                .update({
                  last_active_at: new Date().toISOString(),
                  device_info: deviceInfo
                })
                .eq('id', existingSession.id);
            } else {
              const sessionData = {
                user_id: session.user.id,
                device_info: deviceInfo,
                last_active_at: new Date().toISOString()
              };

              await supabase
                .from('user_sessions')
                .insert([sessionData]);
            }
          } catch (error) {
            console.error("Session management error:", error);
          }

        } catch (error: any) {
          console.error("Profile error:", error);
          toast.error("Error loading user profile");
          if (!isAuthPage) {
            navigate('/auth');
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        if (!isAuthPage) {
          navigate('/auth');
        }
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const targetPath = roleData?.role === 'admin' ? '/' : '/dashboard';
        if (location.pathname !== targetPath) {
          navigate(targetPath);
        }
      } else if (event === 'SIGNED_OUT') {
        if (location.pathname !== '/auth') {
          navigate('/auth');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isAuthPage, location.pathname]);

  return { isLoading, isAdmin };
};
