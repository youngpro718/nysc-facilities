
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeviceInfo } from "../types";
import { toast } from "sonner";

export const useSessionManagement = (isLoginPage: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const lastCheckTimestamp = useRef(0);
  const navigationTimeout = useRef<NodeJS.Timeout>();

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

  const handleNavigation = useCallback((path: string) => {
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }
    
    navigationTimeout.current = setTimeout(() => {
      navigate(path, { replace: true });
    }, 100);
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    const MIN_CHECK_INTERVAL = 1000; // Minimum time between checks in ms

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
          if (!userIsAdmin && location.pathname === '/') {
            handleNavigation('/dashboard');
            setIsLoading(false);
            setInitialCheckComplete(true);
            return;
          }

          if (userIsAdmin && location.pathname === '/dashboard') {
            handleNavigation('/');
            setIsLoading(false);
            setInitialCheckComplete(true);
            return;
          }

          if (isLoginPage) {
            handleNavigation(userIsAdmin ? '/' : '/dashboard');
          }

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
      subscription.unsubscribe();
    };
  }, [navigate, isLoginPage, location.pathname, isSigningOut, createProfileIfNotExists, getCurrentDeviceInfo, findExistingSession, handleNavigation]);

  return { isLoading, isAdmin, initialCheckComplete };
};
