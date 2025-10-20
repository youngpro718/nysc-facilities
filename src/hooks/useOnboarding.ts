import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const onboardingId = user?.id ?? profile?.id;
  const onboardingEmail = profile?.email || (user as any)?.email || null;

  useEffect(() => {
    // Only show onboarding after explicit sign-up flow
    if (!onboardingId) {
      setShowOnboarding(false);
      return;
    }

    // Admins bypass verification - they get immediate access
    if (profile?.access_level === 'admin') {
      console.log('[useOnboarding] Admin user detected, bypassing verification');
      setShowOnboarding(false);
      return;
    }

    // Do not show onboarding until the user's email/account is verified
    if (profile?.verification_status !== 'verified') {
      console.log('[useOnboarding] User not verified, blocking onboarding:', {
        verification_status: profile?.verification_status,
        is_approved: profile?.is_approved,
        access_level: profile?.access_level
      });
      setShowOnboarding(false);
      return;
    }

    // Check database for onboarding completion status
    const hasCompletedInDb = profile?.onboarding_completed || profile?.onboarding_skipped;
    
    // Fallback to localStorage for backward compatibility
    const shouldOnboardNow = localStorage.getItem('ONBOARD_AFTER_SIGNUP') === 'true';
    const shouldOnboardEmail = localStorage.getItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    const hasCompletedInLocalStorage = localStorage.getItem(`onboarding-${onboardingId}`);

    if (shouldOnboardNow && !hasCompletedInDb && !hasCompletedInLocalStorage && onboardingEmail && shouldOnboardEmail === onboardingEmail) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
      if (hasCompletedInDb || hasCompletedInLocalStorage) {
        setOnboardingComplete(true);
      }
    }
  }, [onboardingId, onboardingEmail, profile?.verification_status, profile?.onboarding_completed, profile?.onboarding_skipped]);

  const completeOnboarding = async () => {
    if (onboardingId) {
      // Update database
      try {
        await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', onboardingId);
      } catch (error) {
        console.error('[useOnboarding] Failed to update database:', error);
      }
      
      // Keep localStorage for backward compatibility
      localStorage.setItem(`onboarding-${onboardingId}`, 'completed');
    }
    try {
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP');
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    } catch { /* no-op */ }
    setShowOnboarding(false);
    setOnboardingComplete(true);
  };

  const skipOnboarding = async () => {
    if (onboardingId) {
      // Update database
      try {
        await supabase
          .from('profiles')
          .update({ 
            onboarding_skipped: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', onboardingId);
      } catch (error) {
        console.error('[useOnboarding] Failed to update database:', error);
      }
      
      // Keep localStorage for backward compatibility
      localStorage.setItem(`onboarding-${onboardingId}`, 'skipped');
    }
    try {
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP');
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    } catch { /* no-op */ }
    setShowOnboarding(false);
    setOnboardingComplete(true);
  };

  return {
    showOnboarding,
    onboardingComplete,
    completeOnboarding,
    skipOnboarding
  };
}