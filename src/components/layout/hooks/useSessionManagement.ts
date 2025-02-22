
import { useEffect, useState, useRef } from "react";
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

  // Session check control
  const sessionCheckInProgressRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastNavigationPath = useRef<string>("");
  const lastNavigationTime = useRef<number>(0);

  const getCurrentDeviceInfo = (): DeviceInfo => ({
    name: navigator.userAgent.split('/')[0],
    platform: navigator.platform,
    language: navigator.language,
  });

  const safeNavigate = (path: string) => {
    if (
      path === location.pathname || 
      path === lastNavigationPath.current ||
      Date.now() - lastNavigationTime.current < 300
    ) {
      return;
    }

    lastNavigationPath.current = path;
    lastNavigationTime.current = Date.now();
    navigate(path, { replace: true });
  };

  const updateSession = async (userId: string) => {
    try {
      const deviceInfo = getCurrentDeviceInfo();
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

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
            user_id: userId,
            device_info: deviceInfo,
            last_active_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      console.error("Session update error:", error);
    }
  };

  const handleSessionCheck = async () => {
    // Prevent concurrent session checks
    if (sessionCheckInProgressRef.current) {
      console.log("Session check already in progress, skipping...");
      return;
    }

    try {
      sessionCheckInProgressRef.current = true;
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (!session) {
        console.log("No session found");
        if (!isLoginPage) {
          safeNavigate('/login');
        }
        return;
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      const userIsAdmin = roleData?.role === 'admin';
      setIsAdmin(userIsAdmin);

      // Check profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.verification_status === 'pending') {
        safeNavigate('/verification-pending');
        return;
      }

      if (profile?.verification_status === 'verified') {
        const currentPath = location.pathname;
        const shouldRedirect = (
          (!userIsAdmin && currentPath === '/') ||
          (userIsAdmin && currentPath === '/dashboard') ||
          isLoginPage
        );

        if (shouldRedirect) {
          safeNavigate(userIsAdmin ? '/' : '/dashboard');
        }

        await updateSession(session.user.id);
      }
    } catch (error: any) {
      console.error("Session check error:", error);
      toast.error("Session verification failed. Please try logging in again.");
      if (!isLoginPage) {
        safeNavigate('/login');
      }
    } finally {
      sessionCheckInProgressRef.current = false;
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: any } } | null = null;

    const initializeSession = async () => {
      await handleSessionCheck();
    };

    initializeSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.verification_status === 'pending') {
            safeNavigate('/verification-pending');
            return;
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          safeNavigate(roleData?.role === 'admin' ? '/' : '/dashboard');
        } catch (error) {
          console.error("Error handling sign in:", error);
          toast.error("Error setting up your session. Please try again.");
        }
      } else if (event === 'SIGNED_OUT') {
        safeNavigate('/login');
      }
    });

    // Store subscription reference
    authSubscription = { data: { subscription } };

    return () => {
      mounted = false;
      sessionCheckInProgressRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [navigate, isLoginPage, location.pathname]);

  return { isLoading, isAdmin, initialCheckComplete };
};
