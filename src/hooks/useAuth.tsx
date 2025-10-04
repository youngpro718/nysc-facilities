
import { useState, useCallback, useEffect, useContext, createContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/lib/supabase';
import { UserProfile, UserSignupData } from '@/types/auth';
import { supabase } from '@/lib/supabase';

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

  // Enhanced hallway lighting system - build trigger v2

  // Function to fetch user profile data
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      const userData = await authService.fetchUserProfile(userId);
      
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

      const currentSession = await authService.getSession();
      
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
      
      const userData = await authService.fetchUserProfile(currentSession.user.id);
      setIsAdmin(userData.isAdmin);
      setProfile(userData.profile);

      // Update session tracking in the background
      const deviceInfo = {
        name: navigator.userAgent.split('/')[0],
        platform: navigator.platform,
        language: navigator.language,
      };

      // Using void to execute without awaiting
      void authService.updateSessionTracking(currentSession.user.id, deviceInfo);

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
      await authService.signInWithEmail(email, password);

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
      await authService.signUpWithEmail(email, password, userData);
      
      // Set onboarding flags to trigger onboarding after verification for this user only
      try {
        localStorage.setItem('ONBOARD_AFTER_SIGNUP', 'true');
        localStorage.setItem('ONBOARD_AFTER_SIGNUP_EMAIL', email);
      } catch {
        // no-op
      }

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
        await authService.deleteUserSession(user.id);
      }

      // Clear storage and sign out
      console.log('Clearing storage...');
      localStorage.removeItem('app-auth');
      sessionStorage.clear();
      
      console.log('Calling authSignOut...');
      await authService.signOut();
      
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

    // Centralized redirect logic - ONLY runs on initial load or explicit sign in
    const handleRedirect = (userData: { isAdmin: boolean; profile: UserProfile | null }, isExplicitSignIn: boolean = false) => {
      if (!mounted) return;

      const currentPath = window.location.pathname;

      console.log('handleRedirect: Current path:', currentPath, 'isAdmin:', userData.isAdmin, 'isExplicitSignIn:', isExplicitSignIn);

      // Always enforce verification flow ON INITIAL LOAD or EXPLICIT SIGN IN ONLY
      // Do NOT redirect during background token refreshes
      if (userData.profile?.verification_status === 'pending') {
        // Allowlist public routes where unverified users can browse
        const allowlist = new Set(['/verification-pending', '/features-preview']);
        
        // Only enforce redirect if:
        // 1. This is an explicit sign in event, OR
        // 2. This is initial page load AND we're not already on an allowed page
        if (isExplicitSignIn || (!isInitialized && !allowlist.has(currentPath))) {
          console.log('handleRedirect: Redirecting to verification pending (explicit sign in or initial load)');
          navigate('/verification-pending', { replace: true });
        }
        return;
      }

      // Relaxed redirects to prevent bouncing:
      // - Admins: only redirect from login to admin home
      // - Regular users: only redirect from login to user dashboard
      if (userData.isAdmin) {
        if (currentPath === '/login') {
          console.log('handleRedirect: Admin coming from login, redirecting to home');
          navigate('/', { replace: true });
        }
        return;
      }

      if (currentPath === '/login') {
        console.log('handleRedirect: Regular user coming from login, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('useAuth: Initializing authentication...');
        setIsLoading(true);
        const currentSession = await authService.getSession();
        
        if (!mounted) return;

        if (currentSession) {
          console.log('useAuth: Session found, fetching user data...');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch user profile and role - critical for consistent admin status
          const userData = await authService.fetchUserProfile(currentSession.user.id);
          
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
            await authService.updateSessionTracking(currentSession.user.id, deviceInfo);
          } catch (error) {
            console.error('Session tracking error:', error);
          }
          
          // Handle redirects based on current page and user role (initial load)
          handleRedirect(userData, false);
        } else {
          console.log('useAuth: No session found');
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/verification-pending') {
            navigate('/login', { replace: true });
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
              const userData = await authService.fetchUserProfile(newSession.user.id);
              
              if (!mounted) return;
              
              setIsAdmin(userData.isAdmin);
              setProfile(userData.profile);
              
              // Only redirect after explicit sign in (isInitialized = true means this is NOT initial load)
              // Pass true to indicate this is an explicit sign in event
              if (isInitialized) {
                handleRedirect(userData, true);
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
          if (window.location.pathname !== '/login') {
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
