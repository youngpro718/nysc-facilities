
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

        // Check profile first, before doing anything else
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
          toast.error("Error loading user profile");
          if (!isAuthPage) {
            navigate('/auth');
          }
          setIsLoading(false);
          return;
        }

        // If profile exists and verification is pending, route to pending page
        if (profile?.verification_status === 'pending') {
          if (location.pathname !== '/verification-pending') {
            navigate('/verification-pending');
          }
          setIsLoading(false);
          return;
        }

        // Only proceed with role check and other logic if user is verified
        if (profile?.verification_status === 'verified') {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const userIsAdmin = roleData?.role === 'admin';
          setIsAdmin(userIsAdmin);

          // Handle auth page redirects
          if (isAuthPage) {
            navigate(userIsAdmin ? '/' : '/dashboard');
            setIsLoading(false);
            return;
          }

          // Handle non-auth page access
          if (!userIsAdmin && location.pathname === '/') {
            navigate('/dashboard');
            setIsLoading(false);
            return;
          }

          // Update session info
          try {
            const deviceInfo = getCurrentDeviceInfo();
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
              await supabase
                .from('user_sessions')
                .insert([{
                  user_id: session.user.id,
                  device_info: deviceInfo,
                  last_active_at: new Date().toISOString()
                }]);
            }
          } catch (error) {
            console.error("Session management error:", error);
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
        // Check verification status immediately after sign in
        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.verification_status === 'pending') {
          navigate('/verification-pending');
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        navigate(roleData?.role === 'admin' ? '/' : '/dashboard');
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isAuthPage, location.pathname]);

  return { isLoading, isAdmin };
};
