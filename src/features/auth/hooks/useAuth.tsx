import { useState, useCallback, useEffect, useContext, createContext, ReactNode, useRef } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/lib/supabase';
import { UserProfile, UserSignupData } from '@features/auth/types/auth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// Import new auth services with email verification enforcement
import * as authServices from '@features/auth/services/auth';
import { getMyProfile } from '@features/profile/services/profile';
import { getDashboardForRole, isAdminRole } from '@/routes/roleBasedRouting';

// Define the shape of our auth context
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  userRole: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFacilitiesManager: boolean;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFacilitiesManager, setIsFacilitiesManager] = useState(false);
  const hasCompletedInitialAuth = useRef(false);
  const isFetchingProfile = useRef(false);
  const navigate = useNavigate();

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);

      const currentSession = await authService.getSession();
      
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsFacilitiesManager(false);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);
      
      const userData = await authService.fetchUserProfile(currentSession.user.id);
      setUserRole(userData.profile?.role || null);
      setIsAdmin(userData.isAdmin);
      setIsFacilitiesManager(userData.profile?.role === 'facilities_manager');
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
      logger.error('Session refresh error', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsFacilitiesManager(false);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove getUserProfile dependency as it's not used

  // Sign in function with email verification enforcement
  const signIn = async (email: string, password: string) => {
    try {
      logger.debug('Starting sign in process with email verification check');
      
      // Use new auth service that enforces email verification
      const user = await authServices.signIn(email, password);
      logger.debug('Sign in successful, user verified:', user.id);

      toast.success('Welcome back!', {
        description: "You've successfully signed in."
      });
    } catch (error) {
      logger.error('Sign in error', error);
      
      // Handle specific error types with enhanced messaging
      if (getErrorMessage(error)?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password', {
          description: 'Please check your credentials and try again.'
        });
      } else if (getErrorMessage(error)?.includes('Email not verified')) {
        // Enhanced error handling for unverified emails
        toast.error('Email not verified', {
          description: 'Please check your email and click the verification link.',
          action: {
            label: 'Resend Email',
            onClick: async () => {
              try {
                await authServices.resendVerificationEmail(email);
                toast.success('Verification email sent!', {
                  description: 'Please check your inbox.'
                });
              } catch (resendError) {
                toast.error('Failed to resend email', {
                  description: getErrorMessage(resendError)
                });
              }
            }
          }
        });
      } else if (getErrorMessage(error)?.includes('Email not confirmed')) {
        // Fallback for alternative error message
        toast.error('Email not verified', {
          description: 'Please check your email and verify your account.'
        });
      } else {
        toast.error(getErrorMessage(error) || 'Authentication failed', {
          description: 'Please try again or contact support if the issue persists.'
        });
      }
      throw error;
    }
  };

  // Sign up function with email verification
  const signUp = async (email: string, password: string, userData: UserSignupData) => {
    try {
      logger.debug('Starting sign up process with email verification');
      
      // Pass full user metadata so DB trigger handle_new_user() receives all fields
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            title: userData.title || undefined,
            phone: userData.phone || undefined,
            department_id: userData.department_id || undefined,
            court_position: userData.court_position || undefined,
            room_number: userData.room_number || undefined,
            emergency_contact: userData.emergency_contact || undefined,
            requested_role: userData.requested_role || 'standard',
          }
        }
      });
      
      if (error) throw error;
      
      // Set onboarding flags to trigger onboarding after verification for this user only
      try {
        localStorage.setItem('ONBOARD_AFTER_SIGNUP', 'true');
        localStorage.setItem('ONBOARD_AFTER_SIGNUP_EMAIL', email);
        localStorage.setItem('signup_email', email); // For verification pending page
      } catch {
        // no-op
      }

      toast.success('Account created!', {
        description: 'Your account is being set up. You may need admin approval before full access.'
      });
      
      logger.debug('Sign up successful');
      // NOTE: Email verification is skeleton-only. When ready to enforce,
      // navigate to '/verification-pending' here instead.
      // For now, let the normal onAuthStateChange → handleRedirect flow
      // route the user to the correct place.
    } catch (error) {
      logger.error('Sign up error', error);
      
      // Handle specific error types
      if (getErrorMessage(error)?.includes("User already registered")) {
        toast.error("This email is already registered", {
          description: "Please sign in instead or use a different email address."
        });
      } else if (getErrorMessage(error)?.includes("Password should be at least")) {
        toast.error("Password too weak", {
          description: "Password must be at least 6 characters long."
        });
      } else if (getErrorMessage(error)?.includes("Invalid email")) {
        toast.error("Invalid email address", {
          description: "Please enter a valid email address."
        });
      } else {
        toast.error(getErrorMessage(error) || 'Registration failed', {
          description: 'Please try again or contact support if the issue persists.'
        });
      }
      
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      logger.debug('Starting sign out process');
      setIsLoading(true);
      
      // Delete user session from database if it exists
      if (user) {
        logger.debug('Deleting user session');
        await authService.deleteUserSession(user.id);
      }

      // Clear storage and sign out
      logger.debug('Clearing storage and permissions cache');
      sessionStorage.removeItem('app-auth');
      
      // Clear all permissions caches and preview role
      if (user) {
        localStorage.removeItem(`permissions_cache_${user.id}`);
      }
      localStorage.removeItem('preview_role');
      
      // Clear all cached permissions (in case there are orphaned entries)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('permissions_cache_')) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.clear();
      
      logger.debug('Calling authSignOut');
      await authService.signOut();
      
      // Clear state and reset guards
      logger.debug('Clearing auth state');
      isFetchingProfile.current = false;
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsFacilitiesManager(false);
      
      logger.debug('Sign out complete, navigating to login');
      // Navigate to login page
      navigate('/login', { replace: true });
      toast.success('Successfully signed out!');
    } catch (error) {
      logger.error('Sign out error', error);
      toast.error(getErrorMessage(error) || 'Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auth state listener and initialization
  useEffect(() => {
    let mounted = true;

    const handleRedirect = (
      userData: { isAdmin: boolean; profile: UserProfile | null },
      isExplicitSignIn: boolean = false
    ) => {
      if (!mounted) return;

      const currentPath = window.location.pathname;

      logger.debug('[useAuth.handleRedirect] START', {
        currentPath,
        isExplicitSignIn,
        hasCompletedInitialAuth: hasCompletedInitialAuth.current,
        userRole: userData.profile?.role,
        verificationStatus: userData.profile?.verification_status,
      });

      // NOTE: Email verification enforcement is skeleton-only for now.
      // When ready to enforce, uncomment the verification_status check below.
      // if (userData.profile?.verification_status === 'pending') {
      //   const allowlist = new Set(['/verification-pending']);
      //   if (isExplicitSignIn || (!hasCompletedInitialAuth.current && !allowlist.has(currentPath))) {
      //     navigate('/verification-pending', { replace: true });
      //   }
      //   return;
      // }

      const userRole = userData.profile?.role;
      const correctDashboard = getDashboardForRole(userRole);

      if (currentPath === '/login') {
        logger.debug('[useAuth.handleRedirect] REDIRECT: login -> dashboard', {
          role: userRole,
          dashboard: correctDashboard,
        });
        navigate(correctDashboard, { replace: true });
      } else {
        logger.debug('[useAuth.handleRedirect] NO REDIRECT — user on', { currentPath });
      }
    };

    const initializeAuth = async () => {
      try {
        logger.debug('[useAuth.initializeAuth] START');
        setIsLoading(true);

        const currentSession = await authService.getSession();
        if (!mounted) return;

        if (currentSession) {
          logger.debug('Session found, fetching user data');
          setSession(currentSession);
          setUser(currentSession.user);

          if (isFetchingProfile.current) {
            logger.debug('Profile fetch already in progress, skipping duplicate');
            return;
          }

          isFetchingProfile.current = true;
          const userData = await authService.fetchUserProfile(currentSession.user.id);
          isFetchingProfile.current = false;

          if (!mounted) return;

          setIsAdmin(userData.isAdmin);
          setUserRole(userData.profile?.role || null);
          setIsFacilitiesManager(userData.profile?.role === 'facilities_manager');
          setProfile(userData.profile);

          const deviceInfo = {
            name: navigator.userAgent.split('/')[0],
            platform: navigator.platform,
            language: navigator.language,
          };

          void authService.updateSessionTracking(currentSession.user.id, deviceInfo).catch(error => {
            logger.error('Background session tracking error', error);
          });

          handleRedirect(userData, false);
        } else {
          logger.debug('No session found');
          const currentPath = window.location.pathname;
          const publicPaths = new Set([
            '/login',
            '/verification-pending',
            '/install',
            '/public-forms',
            '/submit-form',
            '/auth/pending-approval',
            '/auth/account-rejected',
            '/forms/key-request',
            '/forms/maintenance-request',
            '/forms/issue-report',
          ]);

          if (!publicPaths.has(currentPath)) {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        logger.error('Auth initialization failed', error);

        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setUserRole(null);
          setIsAdmin(false);
          setIsFacilitiesManager(false);

          if (getErrorMessage(error)?.includes('network') || getErrorMessage(error)?.includes('fetch')) {
            toast.error('Connection Error', {
              description: 'Unable to connect to authentication service.',
            });
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          hasCompletedInitialAuth.current = true;
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      logger.debug('Auth state changed', { event });

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
        logger.debug(`[useAuth.onAuthStateChange] ${event} event`, { userId: newSession.user.id });
        setSession(newSession);
        setUser(newSession.user);

        if (event === 'TOKEN_REFRESHED') {
          logger.debug('[useAuth] Token refreshed silently — no redirect');
          return;
        }

        const currentPath = window.location.pathname;
        const isOnLoginPage = currentPath === '/login';

        (async () => {
          if (!mounted) return;

          if (profile?.id === newSession.user.id && hasCompletedInitialAuth.current) {
            logger.debug('[useAuth] Profile already loaded for this user, skipping refetch');
            if (isOnLoginPage) {
              handleRedirect({ isAdmin, profile }, true);
            }
            return;
          }

          try {
            if (isFetchingProfile.current) {
              logger.debug('Profile fetch in progress, skipping');
              return;
            }

            isFetchingProfile.current = true;
            const userData = await authService.fetchUserProfile(newSession.user.id);
            isFetchingProfile.current = false;

            if (!mounted) return;

            setIsAdmin(userData.isAdmin);
            setUserRole(userData.profile?.role || null);
            setIsFacilitiesManager(userData.profile?.role === 'facilities_manager');
            setProfile(userData.profile);

            if (hasCompletedInitialAuth.current && isOnLoginPage) {
              handleRedirect(userData, true);
            }
          } catch (error) {
            isFetchingProfile.current = false;
            logger.error('Error fetching user data after sign in', error);
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        isFetchingProfile.current = false;
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsFacilitiesManager(false);

        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Compute isAuthenticated derived from session
  const isAuthenticated = !!session;

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        userRole,
        isLoading,
        isAuthenticated,
        isAdmin,
        isFacilitiesManager,
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
