
import { useState, useCallback, useEffect, useContext, createContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  getSession, 
  fetchUserProfile, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as authSignOut, 
  updateSessionTracking,
  deleteUserSession
} from '@/services/supabase/authService';
import { UserProfile, UserSignupData } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

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
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      const userData = await fetchUserProfile(userId);
      
      setIsAdmin(userData.isAdmin);
      setProfile(userData.profile);

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { isAdmin: false, profile: null };
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const currentSession = await getSession();
      
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);
      
      const userData = await getUserProfile(currentSession.user.id);
      setIsAdmin(userData.isAdmin);
      setProfile(userData.profile);

      // Update session tracking in the background
      const deviceInfo = {
        name: navigator.userAgent.split('/')[0],
        platform: navigator.platform,
        language: navigator.language,
      };

      // Using void to execute without awaiting
      void updateSessionTracking(currentSession.user.id, deviceInfo);

    } catch (error) {
      console.error('Session refresh error:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [getUserProfile]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);

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
      await signUpWithEmail(email, password, userData);
      
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
      console.log('Starting sign out process...');
      setIsLoading(true);
      
      // Delete user session from database if it exists
      if (user) {
        console.log('Deleting user session for user:', user.id);
        await deleteUserSession(user.id);
      }

      // Clear storage and sign out
      console.log('Clearing storage...');
      localStorage.removeItem('app-auth');
      sessionStorage.clear();
      
      console.log('Calling authSignOut...');
      await authSignOut();
      
      // Clear state
      console.log('Clearing auth state...');
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      console.log('Sign out complete, navigating to login...');
      // Navigate to login page
      navigate('/login', { replace: true });
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
    let mounted = true;

    // Single initialization function
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const currentSession = await getSession();
        
        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          const userData = await getUserProfile(currentSession.user.id);
          setIsAdmin(userData.isAdmin);
          setProfile(userData.profile);

          // Handle redirects based on current location and user status
          const currentPath = window.location.pathname;
          
          if (currentPath === '/login') {
            if (userData.profile?.verification_status === 'pending') {
              navigate('/verification-pending', { replace: true });
            } else if (userData.isAdmin) {
              navigate('/', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else if (currentPath === '/verification-pending' && userData.profile?.verification_status === 'verified') {
            navigate(userData.isAdmin ? '/' : '/dashboard', { replace: true });
          }
        } else {
          // No session, redirect to login if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/verification-pending') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          const userData = await getUserProfile(newSession.user.id);
          setIsAdmin(userData.isAdmin);
          setProfile(userData.profile);
          
          // Handle post-login redirect
          if (userData.profile?.verification_status === 'pending') {
            navigate('/verification-pending', { replace: true });
          } else if (userData.isAdmin) {
            navigate('/', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          navigate('/login', { replace: true });
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [])

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
