
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

  // Dev-only bypass for auth redirects
  const devBypass =
    (import.meta as any)?.env?.VITE_DISABLE_AUTH_GUARD === 'true' ||
    (import.meta as any)?.env?.VITE_DISABLE_MODULE_GATES === 'true';

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
      console.log('useAuth: Starting sign in process');
      await signInWithEmail(email, password);

      toast.success('Welcome back!', {
        description: "You've successfully signed in."
      });
      console.log('useAuth: Sign in successful');
    } catch (error: any) {
      console.error('useAuth: Sign in error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password', {
          description: 'Please check your credentials and try again.'
        });
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Email not verified', {
          description: 'Please check your email and verify your account.'
        });
      } else {
        toast.error(error.message || 'Authentication failed', {
          description: 'Please try again or contact support if the issue persists.'
        });
      }
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: UserSignupData) => {
    try {
      console.log('useAuth: Starting sign up process');
      await signUpWithEmail(email, password, userData);
      
      toast.success('Account created successfully!', {
        description: "Please check your email for verification instructions."
      });
      
      console.log('useAuth: Sign up successful, navigating to verification');
      // Navigate to verification pending page
      setTimeout(() => {
        navigate('/verification-pending');
      }, 0);
    } catch (error: any) {
      console.error('useAuth: Sign up error:', error);
      
      // Handle specific error types
      if (error.message?.includes("User already registered")) {
        toast.error("This email is already registered", {
          description: "Please sign in instead or use a different email address."
        });
      } else if (error.message?.includes("Password should be at least")) {
        toast.error("Password too weak", {
          description: "Password must be at least 6 characters long."
        });
      } else if (error.message?.includes("Invalid email")) {
        toast.error("Invalid email address", {
          description: "Please enter a valid email address."
        });
      } else {
        toast.error(error.message || 'Registration failed', {
          description: 'Please try again or contact support if the issue persists.'
        });
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

  // Setup auth state listener and initialization
  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    // Centralized redirect logic
    const handleRedirect = (userData: { isAdmin: boolean; profile: UserProfile | null }) => {
      if (devBypass) return; // skip redirects in dev bypass
      if (!mounted) return;
      
      const currentPath = window.location.pathname;
      
      console.log('handleRedirect: Current path:', currentPath, 'isAdmin:', userData.isAdmin);
      
      // Handle verification pending
      if (userData.profile?.verification_status === 'pending') {
        if (currentPath !== '/verification-pending') {
          console.log('handleRedirect: Redirecting to verification pending');
          navigate('/verification-pending', { replace: true });
        }
        return;
      }
      
      if (userData.isAdmin) {
        // Admin user redirect logic
        const isAdminPage = currentPath === '/' || 
                           currentPath.startsWith('/spaces') ||
                           currentPath.startsWith('/occupants') ||
                           currentPath.startsWith('/keys') ||
                           currentPath.startsWith('/lighting') ||
                           currentPath.startsWith('/operations') ||
                           currentPath.startsWith('/access-management') ||
                           currentPath.startsWith('/admin') ||
                           currentPath.startsWith('/maintenance') ||
                           currentPath.startsWith('/court-operations') ||
                           currentPath.startsWith('/inventory') ||
                           currentPath.startsWith('/system-settings') ||
                           currentPath.startsWith('/settings');
        
        // Redirect admin users away from user-only pages or login page to admin dashboard
        if (currentPath === '/login' || 
            currentPath.startsWith('/dashboard') || 
            currentPath === '/my-requests' || 
            currentPath === '/my-issues' ||
            currentPath === '/profile') {
          console.log('handleRedirect: Admin user, redirecting to admin dashboard');
          navigate('/', { replace: true });
        } else if (!isAdminPage) {
          // If admin is on an unknown/invalid page, redirect to admin dashboard
          console.log('handleRedirect: Admin user on unknown page, redirecting to admin dashboard');
          navigate('/', { replace: true });
        }
      } else {
        // Regular user redirect logic
        const isUserPage = currentPath.startsWith('/dashboard') || 
                          currentPath === '/my-requests' || 
                          currentPath === '/my-issues' ||
                          currentPath === '/profile';
        
        // Redirect regular users away from admin pages or login page to user dashboard
        if (currentPath === '/login' || !isUserPage) {
          console.log('handleRedirect: Regular user, redirecting to user dashboard');
          navigate('/dashboard', { replace: true });
        }
      }
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('useAuth: Initializing authentication...');
        const currentSession = await getSession();
        
        if (!mounted) return;

        if (currentSession) {
          console.log('useAuth: Session found, fetching user data...');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch user profile and role - critical for consistent admin status
          const userData = await getUserProfile(currentSession.user.id);
          
          if (!mounted) return;
          
          setIsAdmin(userData.isAdmin);
          setProfile(userData.profile);
          
          // Update session tracking
          try {
            const deviceInfo = {
              name: navigator.userAgent.split('/')[0],
              platform: navigator.platform,
              language: navigator.language,
            };
            await updateSessionTracking(currentSession.user.id, deviceInfo);
          } catch (error) {
            console.error('Session tracking error:', error);
          }
          
          // Handle redirects based on current page and user role
          handleRedirect(userData);
        } else {
          console.log('useAuth: No session found');
          const currentPath = window.location.pathname;
          if (!devBypass) {
            if (currentPath !== '/login' && currentPath !== '/verification-pending') {
              navigate('/login', { replace: true });
            }
          }
        }
      } catch (error: any) {
        console.error('useAuth: Auth initialization failed:', error);
        
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          
          // Only show network errors to avoid spam
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            toast.error('Connection Error', {
              description: 'Unable to connect to authentication service.'
            });
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          isInitialized = true;
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('useAuth: Auth state changed:', event);

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Defer user data fetching to avoid blocking auth state change
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const userData = await getUserProfile(newSession.user.id);
              
              if (!mounted) return;
              
              setIsAdmin(userData.isAdmin);
              setProfile(userData.profile);
              
              // Only redirect after explicit sign in, not during initialization
              if (isInitialized) {
                handleRedirect(userData);
              }
            } catch (error) {
              console.error('useAuth: Error fetching user data after sign in:', error);
            }
          }, 0);
          
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          
          // Only redirect if not already on login page
          if (!devBypass && window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getUserProfile, navigate])

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
