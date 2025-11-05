import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/services/profile';
import { logger } from '@/lib/logger';

/**
 * OnboardingGuard - Route-level enforcement for authentication and onboarding
 * 
 * This guard ensures only secure, fully-onboarded, verified users can access protected routes.
 * It performs the following checks in order:
 * 1. Authentication - User must be signed in
 * 2. Email Verification - Email must be confirmed
 * 3. Profile Completeness - Required profile fields must be filled
 * 4. MFA Enforcement - Privileged roles must have MFA enabled
 * 
 * Users who don't meet requirements are redirected to the appropriate step.
 */
export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const check = async () => {
      try {
        // Don't check if we're already on an auth/onboarding page
        const publicPaths = ['/auth/', '/onboarding/', '/login'];
        if (publicPaths.some(path => location.pathname.startsWith(path))) {
          if (mounted) setChecking(false);
          return;
        }

        // 1) Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          logger.debug('[OnboardingGuard] No session found, redirecting to sign-in');
          navigate('/login', { replace: true });
          return;
        }

        // 2) Check email verification
        if (!session.user.email_confirmed_at) {
          logger.debug('[OnboardingGuard] Email not verified, redirecting to verify');
          navigate('/auth/verify', { replace: true });
          return;
        }

        // 3) Check profile completeness
        try {
          const profile = await getMyProfile();
          
          // Check required profile fields
          const needsProfile = !profile?.first_name || !profile?.last_name;
          if (needsProfile) {
            logger.debug('[OnboardingGuard] Profile incomplete, redirecting to onboarding');
            navigate('/onboarding/profile', { replace: true });
            return;
          }

          // 4) MFA enforcement for privileged roles
          // Fetch user's role from user_roles table
          const { data: userRoleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          const privilegedRoles = ['admin', 'cmc', 'coordinator', 'sergeant', 'facilities_manager'];
          const isPrivileged = userRoleData?.role && privilegedRoles.includes(userRoleData.role);
          const enforceMfa = profile.mfa_enforced === true || isPrivileged;

          if (enforceMfa) {
            // Check if user has verified TOTP factor
            const { data: { user } } = await supabase.auth.getUser();
            const factors = (user as any)?.factors || [];
            const hasVerifiedTotp = Array.isArray(factors) && 
              factors.some((f: any) => f.factor_type === 'totp' && f.status === 'verified');

            if (!hasVerifiedTotp) {
              logger.debug('[OnboardingGuard] MFA required but not enabled, redirecting to MFA setup');
              navigate('/auth/mfa', { replace: true });
              return;
            }
          }

          logger.debug('[OnboardingGuard] All checks passed, user is fully onboarded');
        } catch (profileError) {
          logger.error('[OnboardingGuard] Profile fetch failed:', profileError);
          // If profile fetch fails, redirect to sign-in for safety
          navigate('/login', { replace: true });
          return;
        }
      } catch (error) {
        logger.error('[OnboardingGuard] Check failed:', error);
        navigate('/login', { replace: true });
      } finally {
        if (mounted) setChecking(false);
      }
    };

    // Initial check
    check();

    // Subscribe to auth state changes
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      logger.debug('[OnboardingGuard] Auth state changed:', _event);
      if (!session) {
        navigate('/login', { replace: true });
      } else {
        check();
      }
    });

    return () => {
      mounted = false;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
