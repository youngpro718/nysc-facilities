import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Define the shape of our auth context
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: UserSignupData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Define the shape of user profile
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  avatar_url?: string;
}

// Define the shape of signup data
export interface UserSignupData {
  first_name: string;
  last_name: string;
  title?: string;
  phone?: string;
  department_id?: string;
  court_position?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user profile data
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleError) throw roleError;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, verification_status, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setIsAdmin(roleData?.role === 'admin');
      setProfile(profileData);

      return {
        isAdmin: roleData?.role === 'admin',
        profile: profileData
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { isAdmin: false, profile: null };
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user);
      
      const userData = await fetchUserProfile(session.user.id);
      setIsAdmin(userData.isAdmin);
      setProfile(userData.profile);

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
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!', {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Authentication failed');
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: UserSignupData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            title: userData.title || null,
            phone: userData.phone || null,
            department_id: userData.department_id || null,
            court_position: userData.court_position || null,
            emergency_contact: userData.emergency_contact || null,
          }
        }
      });

      if (error) throw error;
      
      toast.success('Account created successfully!', {
        description: "Please check your email for verification instructions."
      });
      
      // Navigate to verification pending page
      setTimeout(() => {
        navigate('/verification-pending');
      }, 0);
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle "User already registered" error specifically
      if (error.message && error.message.includes("User already registered")) {
        toast.error("This email is already registered", {
          description: "Please sign in instead or use a different email address."
        });
      } else {
        toast.error(error.message || 'Registration failed');
      }
      
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Delete user session from database if it exists
      if (user) {
        const { data } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (data?.id) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', data.id);
        }
      }

      // Clear storage and sign out
      localStorage.removeItem('app-auth');
      sessionStorage.clear();
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear state
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      // Navigate to login page
      navigate('/login');
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auth state listener
  useEffect(() => {
    // First, set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Fetch user profile data
          setTimeout(async () => {
            const userData = await fetchUserProfile(newSession.user.id);
            setIsAdmin(userData.isAdmin);
            setProfile(userData.profile);
            
            // Redirect based on verification status
            if (userData.profile?.verification_status === 'pending') {
              navigate('/verification-pending');
            } else {
              // Redirect based on role
              navigate(userData.isAdmin ? '/' : '/dashboard');
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          navigate('/login');
        }
      }
    );

    // Then check for an existing session
    refreshSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, navigate, refreshSession]);

  // Compute isAuthenticated derived from session
  const isAuthenticated = !!session;

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAuthenticated,
        isAdmin,
        signIn,
        signUp,
        signOut,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
