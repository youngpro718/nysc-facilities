
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    avatar_url?: string;
  } | null;
}

export interface AuthSessionHook extends AuthState {
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Consolidated hook for Supabase authentication session management
 */
export function useAuthSession(): AuthSessionHook {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    profile: null,
  });

  const refreshInProgress = useRef(false);
  const authTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to safely update auth state
  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...newState }));
  }, []);

  // Handle the user profile and role data
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Get user role and profile in parallel
      const [roleResponse, profileResponse] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      ]);

      const isUserAdmin = roleResponse.data?.role === 'admin';
      
      console.log('useAuthSession - fetchUserData:', {
        userId,
        roleData: roleResponse.data,
        isUserAdmin,
        profileData: profileResponse.data
      });

      updateAuthState({
        isAdmin: isUserAdmin,
        profile: profileResponse.data,
      });

      return {
        isAdmin: isUserAdmin,
        profile: profileResponse.data,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { isAdmin: false, profile: null };
    }
  }, [updateAuthState]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('Auth state changed:', event);
    
    // Clear any pending auth timeouts
    if (authTimeout.current) {
      clearTimeout(authTimeout.current);
      authTimeout.current = null;
    }

    // Debounce auth state changes
    authTimeout.current = setTimeout(async () => {
      if (event === 'SIGNED_IN' && session) {
        try {
          updateAuthState({ isLoading: true });
          
          const userData = await fetchUserData(session.user.id);
          
          updateAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
            session
          });
        } catch (error) {
          console.error('Error handling sign in:', error);
          updateAuthState({ isLoading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        updateAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          session: null,
          profile: null,
        });
      }
    }, 100);
  }, [fetchUserData, updateAuthState]);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    if (refreshInProgress.current) {
      console.log('Session refresh already in progress, skipping...');
      return;
    }

    refreshInProgress.current = true;
    try {
      updateAuthState({ isLoading: true });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (!session) {
        updateAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          session: null,
          profile: null,
        });
        return;
      }

      const userData = await fetchUserData(session.user.id);

      updateAuthState({
        isAuthenticated: true,
        isAdmin: userData.isAdmin,
        isLoading: false,
        user: session.user,
        session,
        profile: userData.profile,
      });

      // Update session tracking in the background
      const deviceInfo = {
        name: navigator.userAgent.split('/')[0],
        platform: navigator.platform,
        language: navigator.language,
      };

      // Using void to execute without awaiting
      void (async () => {
        try {
          const { data: existingSession } = await supabase
            .from('user_sessions')
            .select('id')
            .eq('user_id', session.user.id)
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
                user_id: session.user.id,
                device_info: deviceInfo,
                last_active_at: new Date().toISOString()
              }]);
          }
        } catch (error) {
          console.error('Session tracking error:', error);
        }
      })();

    } catch (error) {
      console.error('Session refresh error:', error);
      updateAuthState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        user: null,
        session: null,
        profile: null,
      });
    } finally {
      refreshInProgress.current = false;
    }
  }, [fetchUserData, updateAuthState]);

  // Login function
  const signIn = async (email: string, password: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast.success('Welcome back!', {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Authentication failed');
      throw error;
    }
  };

  // Logout function
  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        updateAuthState({ isLoading: true });
        
        // Delete user session from database
        const { data } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (data?.id) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', data.id);
        }

        // Clear storage and sign out
        localStorage.removeItem('app-auth');
        sessionStorage.clear();
        await supabase.auth.signOut({ scope: 'global' });
        
        updateAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          session: null,
          profile: null,
        });

        toast.success('Successfully signed out!');
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Error signing out');
    }
  };

  // Initial session setup
  useEffect(() => {
    // Initial session check
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      if (authTimeout.current) {
        clearTimeout(authTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, refreshSession]);

  return {
    ...authState,
    refreshSession,
    signIn,
    signOut,
  };
}
