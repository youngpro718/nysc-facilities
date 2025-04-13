import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  user: any | null;
  profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    avatar_url?: string;
  } | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('AuthProvider initializing...');
  const navigate = useNavigate();
  const refreshInProgress = useRef(false);
  const tokenRefreshInProgress = useRef(false);
  const lastAuthEvent = useRef<string | null>(null);
  const authTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    user: null,
    profile: null,
  });

  const handleAuthStateChange = async (event: string, session: any) => {
    console.log('Auth state changed:', event);
    
    // Clear any pending auth timeouts
    if (authTimeout.current) {
      clearTimeout(authTimeout.current);
      authTimeout.current = null;
    }

    // Prevent duplicate events
    if (event === lastAuthEvent.current) {
      console.log('Duplicate auth event, skipping...');
      return;
    }

    // Handle token refresh
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed, updating ref...');
      tokenRefreshInProgress.current = true;
      lastAuthEvent.current = event;
      return;
    }

    // Skip state updates during token refresh
    if (tokenRefreshInProgress.current && event === 'INITIAL_SESSION') {
      console.log('Skipping INITIAL_SESSION during token refresh...');
      return;
    }

    // Reset token refresh flag on sign in/out
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      tokenRefreshInProgress.current = false;
    }

    lastAuthEvent.current = event;

    // Debounce auth state changes
    authTimeout.current = setTimeout(async () => {
      if (event === 'SIGNED_IN' && session) {
        try {
          setAuthState(prev => ({ ...prev, isLoading: true }));
          
          // Get user role and profile
          const [roleResponse, profileResponse] = await Promise.all([
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
          ]);

          const isUserAdmin = roleResponse.data?.role === 'admin';
          
          // Update state immediately with session data
          setAuthState({
            isAuthenticated: true,
            isAdmin: isUserAdmin,
            isLoading: false,
            user: session.user,
            profile: profileResponse.data,
          });

          // Navigate based on role and verification status
          if (profileResponse.data?.verification_status === 'pending') {
            navigate('/verification-pending');
          } else {
            navigate(isUserAdmin ? '/' : '/dashboard');
          }
        } catch (error) {
          console.error('Error handling sign in:', error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          profile: null,
        });
        navigate('/login');
      }
    }, 100); // Small delay to debounce multiple rapid auth state changes
  };

  const refreshSession = async () => {
    // Prevent concurrent refreshes
    if (refreshInProgress.current) {
      console.log('Session refresh already in progress, skipping...');
      return;
    }

    refreshInProgress.current = true;
    try {
      console.log('Starting session refresh...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (!session) {
        console.log('No session found');
        setAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          profile: null,
        });
        return;
      }

      // Skip if token refresh is in progress
      if (tokenRefreshInProgress.current) {
        console.log('Token refresh in progress, skipping session refresh...');
        return;
      }

      console.log('Session found, fetching user data...');

      // Get user role and profile in parallel
      const [roleResponse, profileResponse] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
      ]);

      const isUserAdmin = roleResponse.data?.role === 'admin';

      setAuthState({
        isAuthenticated: true,
        isAdmin: isUserAdmin,
        isLoading: false,
        user: session.user,
        profile: profileResponse.data,
      });

      // Update session tracking in the background without awaiting
      const deviceInfo = {
        name: navigator.userAgent.split('/')[0],
        platform: navigator.platform,
        language: navigator.language,
      };

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
      setAuthState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        user: null,
        profile: null,
      });
    } finally {
      refreshInProgress.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Don't navigate here - let the auth state change handler do it
      toast.success('Welcome back!', {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Authentication failed');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
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
        
        setAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          user: null,
          profile: null,
        });

        navigate('/login');
        toast.success('Successfully signed out!');
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Error signing out');
    }
  };

  useEffect(() => {
    console.log('AuthProvider mounted, current state:', authState);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Initial session check
    refreshSession().catch(error => {
      console.error('Failed to refresh initial session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    });
    
    return () => {
      console.log('AuthProvider unmounting...');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 