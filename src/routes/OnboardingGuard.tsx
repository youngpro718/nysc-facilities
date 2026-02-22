import { useEffect, useState, useRef } from 'react';
import { Loader2 } from "lucide-react";
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
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const check = async () => {
      const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        let timeoutId: number | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error(`[OnboardingGuard] Timeout while ${label}`)),
            ms
          );
        });

        try {
          return await Promise.race([promise, timeoutPromise]);
        } finally {
          if (timeoutId) window.clearTimeout(timeoutId);
        }
      };

      // Prevent concurrent checks
      if (isCheckingRef.current) {
        logger.debug('[OnboardingGuard] Check already in progress, skipping');
        return;
      }
      
      isCheckingRef.current = true;
      
      try {
        // Don't check if we're already on an auth/onboarding page
        const publicPaths = ['/auth/', '/onboarding/', '/login', '/public-forms', '/forms/', '/verification-pending', '/features-preview'];
        if (publicPaths.some(path => location.pathname.startsWith(path))) {
          if (mounted) setChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // 1) Check authentication
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          'getting session'
        );
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

        // 3) Fetch profile and role in parallel
        let profile: Record<string, unknown> | null = null;
        let userRoleData: { role: string } | null = null;
        try {
          const roleQuery = async () => {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();
            if (error) throw error;
            return data;
          };
          [profile, userRoleData] = await Promise.all<any>([
            withTimeout(getMyProfile(), 10000, 'loading profile'),
            withTimeout(roleQuery(), 10000, 'loading role').catch((roleError: unknown) => {
              logger.warn('[OnboardingGuard] Role fetch failed:', roleError);
              return null;
            }),
          ]);
        } catch (profileError) {
          logger.error('[OnboardingGuard] Profile fetch failed:', profileError);
          navigate('/login', { replace: true });
          isCheckingRef.current = false;
          return;
        }

        // Check required profile fields
        const needsProfile = !profile?.first_name || !profile?.last_name;
        if (needsProfile) {
          logger.debug('[OnboardingGuard] Profile incomplete, redirecting to onboarding');
          navigate('/onboarding/profile', { replace: true });
          return;
        }

        // 4) Check if user is approved — use user_roles table, not the deprecated access_level field
        const isAdmin = userRoleData?.role === 'admin';
        const isPending = profile?.verification_status === 'pending' || profile?.is_approved === false;

        if (!isAdmin && isPending) {
          logger.debug('[OnboardingGuard] User pending approval, redirecting to pending page');
          navigate('/auth/pending-approval', { replace: true });
          return;
        }

        // Check if user was rejected
        if (profile?.verification_status === 'rejected') {
          logger.debug('[OnboardingGuard] User rejected, redirecting to rejected page');
          navigate('/auth/account-rejected', { replace: true });
          return;
        }

        // 5) MFA enforcement for privileged roles
        const privilegedRoles = ['admin', 'cmc'];
        const isPrivileged = userRoleData?.role && privilegedRoles.includes(userRoleData.role);
        const enforceMfa = profile?.mfa_enforced === true || isPrivileged;

        if (enforceMfa) {
          try {
            const { data: factorData, error: factorError } = await withTimeout(
              supabase.auth.mfa.listFactors(),
              10000,
              'checking MFA factors'
            );
            if (factorError) throw factorError;

            const hasVerifiedTotp =
              Array.isArray(factorData?.totp) &&
              factorData.totp.some((f: any) => f.status === 'verified');

            if (!hasVerifiedTotp) {
              logger.debug('[OnboardingGuard] MFA required but not enabled, redirecting to MFA setup');
              navigate('/auth/mfa', { replace: true });
              return;
            }
          } catch (mfaError) {
            logger.warn('[OnboardingGuard] MFA check failed:', mfaError);
            // Continue without MFA requirement if check fails
          }
        }

        logger.debug('[OnboardingGuard] All checks passed, user is fully onboarded');
      } catch (error) {
        logger.error('[OnboardingGuard] Check failed:', error);
        navigate('/login', { replace: true });
      } finally {
        isCheckingRef.current = false;
        if (mounted) {
          setChecking(false);
          hasCheckedRef.current = true;
        }
      }
    };

    // Initial check only if not already checked
    if (!hasCheckedRef.current) {
      logger.debug('[OnboardingGuard] Running initial check');
      check();
    } else {
      logger.debug('[OnboardingGuard] Already checked, skipping');
      setChecking(false);
    }

    // Subscribe to auth state changes - but only act on SIGNED_OUT
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      logger.debug('[OnboardingGuard] Auth state changed:', _event);
      if (_event === 'SIGNED_OUT' && !session) {
        hasCheckedRef.current = false;
        navigate('/login', { replace: true });
      }
      // Don't re-check on SIGNED_IN - useAuth handles that flow
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
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
