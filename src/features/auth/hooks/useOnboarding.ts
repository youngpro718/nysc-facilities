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

    // Admins bypass entirely
    if (profile?.access_level === 'admin' || profile?.role === 'admin' || profile?.role === 'system_admin' || profile?.role === 'facilities_manager') {
      logger.debug('[useOnboarding] Admin user detected, bypassing onboarding wizard');
      setShowOnboarding(false);
      setOnboardingComplete(true);
      return;
    }

    // Tour is now opt-in: it never auto-shows on first login.
    // Users launch it on demand via the "Take the tour" entry in Help.
    setShowOnboarding(false);

    const hasCompletedInDb = profile?.onboarding_completed || profile?.onboarding_skipped;
    const hasCompletedInLocalStorage = localStorage.getItem(`onboarding-${onboardingId}`);
    setOnboardingComplete(Boolean(hasCompletedInDb || hasCompletedInLocalStorage));
  }, [onboardingId, profile?.verification_status, profile?.onboarding_completed, profile?.onboarding_skipped, profile?.access_level, profile?.role]);

  // Other parts of the app launch the tour on demand via a window event.
  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener('start-onboarding-tour', handler);
    return () => window.removeEventListener('start-onboarding-tour', handler);
  }, []);

  const startOnboarding = () => setShowOnboarding(true);

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
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  };
}
