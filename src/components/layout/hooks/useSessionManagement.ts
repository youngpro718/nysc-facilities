
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";
import { toast } from "sonner";
import { debounce } from "lodash";

export const useSessionManagement = (isLoginPage: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const lastCheckTimestamp = useRef(0);
  const navigationTimeout = useRef<NodeJS.Timeout>();
  const isNavigating = useRef(false);

  const getCurrentDeviceInfo = useCallback((): DeviceInfo => ({
    name: navigator.userAgent.split('/')[0],
    platform: navigator.platform,
    language: navigator.language,
  }), []);

  const findExistingSession = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data;
  }, []);

  const createProfileIfNotExists = useCallback(async (user: any) => {
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

      if (createError) {
        console.error("Error creating profile:", createError);
        throw createError;
      }
    }
  }, []);

  // Debounced navigation handler to prevent rapid consecutive navigations
  const handleNavigation = useCallback(
    debounce((path: string) => {
      if (isNavigating.current || path === location.pathname) {
        return;
      }
      isNavigating.current = true;
      navigate(path, { replace: true });
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    }, 300),
    [navigate, location.pathname]
  );

  useEffect(() => {
    let mounted = true;
    const MIN_CHECK_INTERVAL = 2000; // Increased minimum time between checks to 2 seconds

    const checkSession = async () => {
      try {
        const now = Date.now();
        if (now - lastCheckTimestamp.current < MIN_CHECK_INTERVAL) {
          return;
        }
        lastCheckTimestamp.current = now;

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error || !session) {
          if (!isLoginPage && mounted) {
            handleNavigation('/login');
          }
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        if (isSigningOut) {
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const userIsAdmin = roleData?.role === 'admin';
        setIsAdmin(userIsAdmin);

        await createProfileIfNotExists(session.user);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
          toast.error("Error loading user profile");
          handleNavigation('/login');
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        if (profile?.verification_status === 'pending') {
          handleNavigation('/verification-pending');
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        if (profile?.verification_status === 'verified') {
          // Consolidate navigation logic to prevent redundant navigations
          let targetPath = location.pathname;
          
          if (isLoginPage) {
            targetPath = userIsAdmin ? '/' : '/dashboard';
          } else if (!userIsAdmin && location.pathname === '/') {
            targetPath = '/dashboard';
          } else if (userIsAdmin && location.pathname === '/dashboard') {
            targetPath = '/';
          }

          if (targetPath !== location.pathname) {
            handleNavigation(targetPath);
          }

          // Update device info and session
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

        setIsLoading(false);
        setInitialCheckComplete(true);
      } catch (error) {
        console.error("Auth error:", error);
        if (!isLoginPage && mounted) {
          handleNavigation('/login');
        }
        setIsLoading(false);
        setInitialCheckComplete(true);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsSigningOut(false);
        await createProfileIfNotExists(session.user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.verification_status === 'pending') {
          handleNavigation('/verification-pending');
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        handleNavigation(roleData?.role === 'admin' ? '/' : '/dashboard');
      } else if (event === 'SIGNED_OUT') {
        setIsSigningOut(true);
        handleNavigation('/login');
      }
    });

    return () => {
      mounted = false;
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      handleNavigation.cancel();
      subscription.unsubscribe();
    };
  }, [navigate, isLoginPage, location.pathname, isSigningOut, createProfileIfNotExists, getCurrentDeviceInfo, findExistingSession, handleNavigation]);

  return { isLoading, isAdmin, initialCheckComplete };
};
