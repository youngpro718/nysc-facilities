import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const onboardingId = user?.id ?? profile?.id;

  useEffect(() => {
    if (!onboardingId || !profile) {
      setShowOnboarding(false);
      return;
    }

    // Admins bypass onboarding wizard - they get immediate access
    if (profile?.access_level === 'admin' || profile?.role === 'admin') {
      logger.debug('[useOnboarding] Admin user detected, bypassing onboarding wizard');
      setShowOnboarding(false);
      setOnboardingComplete(true);
      return;
    }

    // Only show onboarding for verified & approved users
    if (profile?.verification_status !== 'verified') {
      logger.debug('[useOnboarding] User not verified, blocking onboarding');
      setShowOnboarding(false);
      return;
    }

    // Check if onboarding was already completed or skipped (DB is source of truth)
    const hasCompletedInDb = profile?.onboarding_completed || profile?.onboarding_skipped;
    // Fallback to localStorage for backward compatibility
    const hasCompletedInLocalStorage = localStorage.getItem(`onboarding-${onboardingId}`);

    if (hasCompletedInDb || hasCompletedInLocalStorage) {
      logger.debug('[useOnboarding] Onboarding already completed/skipped');
      setShowOnboarding(false);
      setOnboardingComplete(true);
    } else {
      // Verified user who hasn't completed onboarding — show wizard
      logger.debug('[useOnboarding] Showing onboarding wizard for verified user');
      setShowOnboarding(true);
      setOnboardingComplete(false);
    }
  }, [onboardingId, profile?.verification_status, profile?.onboarding_completed, profile?.onboarding_skipped, profile?.access_level, profile?.role]);

  const completeOnboarding = async () => {
    if (onboardingId) {
      try {
        await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', onboardingId);
      } catch (error) {
        logger.error('[useOnboarding] Failed to update database:', error);
      }
      localStorage.setItem(`onboarding-${onboardingId}`, 'completed');
    }
    // Clean up legacy localStorage flags
    try {
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP');
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    } catch { /* no-op */ }
    setShowOnboarding(false);
    setOnboardingComplete(true);
  };

  const skipOnboarding = async () => {
    if (onboardingId) {
      try {
        await supabase
          .from('profiles')
          .update({ 
            onboarding_skipped: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', onboardingId);
      } catch (error) {
        logger.error('[useOnboarding] Failed to update database:', error);
      }
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