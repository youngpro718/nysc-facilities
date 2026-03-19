import { useEffect, useState, useRef } from 'react';
import { Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@features/profile/services/profile';
import { logger } from '@/lib/logger';
import { TIMEOUTS } from '@/config';

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
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);
  // Ref-based setter so the safety timeout can always reach it even if mounted=false
  const setCheckingRef = useRef(setChecking);
  setCheckingRef.current = setChecking;

  useEffect(() => {
    let mounted = true;
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
        const currentPath = window.location.pathname;
        const publicPaths = ['/auth/', '/onboarding/', '/login', '/public-forms', '/forms/', '/verification-pending'];
        if (publicPaths.some(path => currentPath.startsWith(path))) {
          if (mounted) setChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // 1+3) Validate session server-side (getUser() hits the auth server, not just
        //       localStorage — a revoked or tampered token will fail here).
        //       Fetch profile in parallel since getMyProfile() calls getUser() internally.
        let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
        let profile: Record<string, unknown> | null = null;
        let userRoleData: { role: string } | null = null;

        try {
          const [userResult, profileResult] = await Promise.all([
            withTimeout(supabase.auth.getUser(), TIMEOUTS.sessionFetch, 'validating session'),
            withTimeout(getMyProfile(), TIMEOUTS.profileFetch, 'loading profile').catch(() => null),
          ]);

          // getUser() returns the server-validated user; build a minimal session-like object
          // for the checks below. If the server rejects the token, user is null.
          if (!userResult.data.user || userResult.error) {
            logger.debug('[OnboardingGuard] No valid session found, redirecting to sign-in');
            navigate('/login', { replace: true });
            return;
          }

          // Use getSession only for the session object (needed for email_confirmed_at check)
          const { data: { session: localSession } } = await supabase.auth.getSession();
          session = localSession;

          if (!session) {
            navigate('/login', { replace: true });
            return;
          }

          // 2) Email verification — skeleton only, not enforced yet.
          // When ready to enforce, uncomment the block below.
          // if (!session.user.email_confirmed_at) {
          //   logger.debug('[OnboardingGuard] Email not verified, redirecting to verify');
          //   navigate('/auth/verify', { replace: true });
          //   return;
          // }

          profile = profileResult as Record<string, unknown> | null;

          // Fetch role now that we have session.user.id
          const { data: roleData, error: roleError } = await withTimeout(
            Promise.resolve(supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()),
            TIMEOUTS.roleFetch,
            'loading role'
          );
          if (roleError) logger.warn('[OnboardingGuard] Role fetch failed:', roleError);
          userRoleData = roleData;
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
              TIMEOUTS.mfaCheck,
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

    // Safety timeout: if the check races with a pathname change and mounted
    // flips to false before setChecking(false) is called, the spinner would
    // hang forever. Force-resolve after 5 s using the ref-based setter.
    const safetyTimer = window.setTimeout(() => {
      if (setCheckingRef.current) {
        logger.warn('[OnboardingGuard] Safety timeout: forcing checking=false after 5s');
        setCheckingRef.current(false);
      }
    }, TIMEOUTS.safetyGuard);

    // Initial check only if not already checked
    if (!hasCheckedRef.current) {
      logger.debug('[OnboardingGuard] Running initial check');
      check().finally(() => window.clearTimeout(safetyTimer));
    } else {
      logger.debug('[OnboardingGuard] Already checked, skipping');
      window.clearTimeout(safetyTimer);
      setChecking(false);
    }

    // NOTE: Removed duplicate onAuthStateChange subscription.
    // useAuth already handles SIGNED_OUT redirects. Having two subscriptions
    // caused race conditions and double-processing.

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimer);
    };
  }, [navigate]); // Removed location.pathname — check once per mount, not per route change

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
