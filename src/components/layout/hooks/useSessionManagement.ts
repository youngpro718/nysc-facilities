
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";

export const useSessionManagement = (isAuthPage: boolean) => {
  const navigate = useNavigate();
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
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          navigate('/auth');
          return;
        }

        if (!session) {
          if (!isAuthPage) {
            navigate('/auth');
          }
          return;
        }

        if (isAuthPage) {
          navigate('/');
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

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const userIsAdmin = roleData?.role === 'admin';
          setIsAdmin(userIsAdmin);

          // Redirect based on role
          if (!isAuthPage) {
            if (userIsAdmin) {
              if (window.location.pathname === '/dashboard') {
                navigate('/');
              }
            } else {
              if (window.location.pathname === '/') {
                navigate('/dashboard');
              }
            }
          }
        } catch (error) {
          console.error("Session management error:", error);
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (isAuthPage) {
          // Check user role and redirect accordingly
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session?.user.id)
            .maybeSingle();

          if (roleData?.role === 'admin') {
            navigate('/');
          } else {
            navigate('/dashboard');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isAuthPage]);

  return { isLoading, isAdmin };
};
