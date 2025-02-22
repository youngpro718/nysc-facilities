
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";
import { toast } from "sonner";

export const useSessionManagement = (isLoginPage: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  const getCurrentDeviceInfo = (): DeviceInfo => ({
    name: navigator.userAgent.split('/')[0],
    platform: navigator.platform,
    language: navigator.language,
  });

  const handleNavigation = (route: string) => {
    if (!navigationInProgress && location.pathname !== route) {
      setNavigationInProgress(true);
      navigate(route);
      // Reset navigation lock after a short delay
      setTimeout(() => setNavigationInProgress(false), 100);
    }
  };

  const findExistingSession = async (userId: string) => {
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data;
  };

  const createProfileIfNotExists = async (user: any) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            verification_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createError) throw createError;
      }
    } catch (error) {
      console.error("Error in profile creation:", error);
      throw error;
    }
  };

  const handleSession = async (session: any) => {
    if (!session?.user) {
      if (!isLoginPage) {
        handleNavigation('/login');
      }
      setIsLoading(false);
      setInitialCheckComplete(true);
      return;
    }

    try {
      // Create profile if it doesn't exist
      await createProfileIfNotExists(session.user);

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const userIsAdmin = roleData?.role === 'admin';
      setIsAdmin(userIsAdmin);

      // Check profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.verification_status === 'pending') {
        handleNavigation('/verification-pending');
        return;
      }

      // Handle route protection based on role
      if (profile?.verification_status === 'verified') {
        if (!userIsAdmin && location.pathname === '/') {
          handleNavigation('/dashboard');
        } else if (userIsAdmin && location.pathname === '/dashboard') {
          handleNavigation('/');
        } else if (isLoginPage) {
          handleNavigation(userIsAdmin ? '/' : '/dashboard');
        }

        // Update session info
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
      }
    } catch (error) {
      console.error("Session handling error:", error);
      toast.error("Error handling session");
    } finally {
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        await handleSession(session);
      } catch (error) {
        console.error("Initial session check error:", error);
        setIsLoading(false);
        setInitialCheckComplete(true);
      }
    };

    checkSession();

    // Auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        handleNavigation('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isLoginPage, location.pathname]);

  return { isLoading, isAdmin, initialCheckComplete };
};
