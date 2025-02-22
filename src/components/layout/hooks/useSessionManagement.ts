
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";
import { toast } from "sonner";
import { delay } from "@/utils/timing";

// Maximum number of retries for session checks
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries

export const useSessionManagement = (isLoginPage: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Session check control
  const sessionCheckInProgressRef = useRef(false);
  const retryCountRef = useRef(0);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastNavigationPathRef = useRef<string>('');
  const lastNavigationTimeRef = useRef<number>(0);

  const getCurrentDeviceInfo = (): DeviceInfo => ({
    name: navigator.userAgent.split('/')[0],
    platform: navigator.platform,
    language: navigator.language,
  });

  const findExistingSession = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      return data;
    } catch (error) {
      console.error("Error finding existing session:", error);
      return null;
    }
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

  const safeNavigate = (path: string) => {
    if (path === location.pathname || path === lastNavigationPathRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastNavigation = now - lastNavigationTimeRef.current;
    
    if (timeSinceLastNavigation < 300) {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      navigationTimeoutRef.current = setTimeout(() => {
        lastNavigationPathRef.current = path;
        lastNavigationTimeRef.current = Date.now();
        navigate(path, { replace: true });
      }, 300);
      return;
    }

    lastNavigationPathRef.current = path;
    lastNavigationTimeRef.current = now;
    navigate(path, { replace: true });
  };

  const handleSessionCheck = async () => {
    if (sessionCheckInProgressRef.current) {
      console.log("Session check already in progress, skipping...");
      return;
    }

    try {
      sessionCheckInProgressRef.current = true;
      console.log("Starting session check...");

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (!session) {
        console.log("No session found");
        if (!isLoginPage) {
          safeNavigate('/login');
        }
        return;
      }

      console.log("Session found, checking user status...");

      // Skip other checks if signing out
      if (isSigningOut) {
        console.log("User is signing out, skipping further checks");
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

      // Ensure profile exists
      await createProfileIfNotExists(session.user);

      // Check profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      console.log("Profile status:", profile?.verification_status);

      if (profile?.verification_status === 'pending') {
        safeNavigate('/verification-pending');
        return;
      }

      if (profile?.verification_status === 'verified') {
        const currentPath = location.pathname;
        const shouldRedirect = (
          (!userIsAdmin && currentPath === '/') ||
          (userIsAdmin && currentPath === '/dashboard') ||
          (isLoginPage)
        );

        if (shouldRedirect) {
          console.log("Redirecting user based on role...");
          safeNavigate(userIsAdmin ? '/' : '/dashboard');
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

      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error("Session check error:", error);
      retryCountRef.current++;

      if (retryCountRef.current <= MAX_RETRIES) {
        console.log(`Retry attempt ${retryCountRef.current} of ${MAX_RETRIES}...`);
        await delay(RETRY_DELAY);
        await handleSessionCheck();
      } else {
        console.log("Max retries reached, redirecting to login...");
        toast.error("Session verification failed. Please try logging in again.");
        if (!isLoginPage) {
          safeNavigate('/login');
        }
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
      if (isLoading) {
        await delay(100);
      }
      await handleSessionCheck();
    };

    initializeSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        setIsSigningOut(false);
        try {
          await createProfileIfNotExists(session.user);

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

          await delay(100);
          safeNavigate(roleData?.role === 'admin' ? '/' : '/dashboard');
        } catch (error) {
          console.error("Error handling sign in:", error);
          toast.error("Error setting up your session. Please try again.");
        }
      } else if (event === 'SIGNED_OUT') {
        setIsSigningOut(true);
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
  }, [navigate, isLoginPage, location.pathname, isSigningOut]);

  return { isLoading, isAdmin, initialCheckComplete };
};

