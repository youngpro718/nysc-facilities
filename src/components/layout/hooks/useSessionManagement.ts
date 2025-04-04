
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

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

  const createProfileIfNotExists = async (user: any) => {
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
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error || !session) {
          console.error("Session error:", error);
          if (!isLoginPage) {
            navigate('/login');
          }
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        // Skip other checks if signing out
        if (isSigningOut) {
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        // Get user role immediately
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const userIsAdmin = roleData?.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Create profile if doesn't exist
        await createProfileIfNotExists(session.user);

        // Check profile status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
          toast.error("Error loading user profile");
          navigate('/login');
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        // Handle verification pending
        if (profile?.verification_status === 'pending') {
          navigate('/verification-pending');
          setIsLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        // Handle route protection based on role
        if (profile?.verification_status === 'verified') {
          // Prevent access to admin routes for non-admin users
          if (!userIsAdmin && location.pathname === '/') {
            navigate('/dashboard');
            setIsLoading(false);
            setInitialCheckComplete(true);
            return;
          }

          // Prevent access to user dashboard for admin users
          if (userIsAdmin && location.pathname === '/dashboard') {
            navigate('/');
            setIsLoading(false);
            setInitialCheckComplete(true);
            return;
          }

          // Handle login page redirects
          if (isLoginPage) {
            navigate(userIsAdmin ? '/' : '/dashboard');
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
        setInitialCheckComplete(true);
      } catch (error) {
        console.error("Auth error:", error);
        if (!isLoginPage) {
          navigate('/login');
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
        setIsSigningOut(true);
        navigate('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isLoginPage, location.pathname, isSigningOut]);

  return { isLoading, isAdmin, initialCheckComplete };
};
