import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

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

    // Do not show onboarding until the user's email/account is verified
    if (profile?.verification_status !== 'verified') {
      setShowOnboarding(false);
      return;
    }

    const shouldOnboardNow = localStorage.getItem('ONBOARD_AFTER_SIGNUP') === 'true';
    const shouldOnboardEmail = localStorage.getItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    const hasCompletedOnboarding = localStorage.getItem(`onboarding-${onboardingId}`);

    if (shouldOnboardNow && !hasCompletedOnboarding && onboardingEmail && shouldOnboardEmail === onboardingEmail) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
      if (hasCompletedOnboarding) {
        setOnboardingComplete(true);
      }
    }
  }, [onboardingId, onboardingEmail, profile?.verification_status]);

  const completeOnboarding = () => {
    if (onboardingId) {
      localStorage.setItem(`onboarding-${onboardingId}`, 'completed');
    }
    try {
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP');
      localStorage.removeItem('ONBOARD_AFTER_SIGNUP_EMAIL');
    } catch { /* no-op */ }
    setShowOnboarding(false);
    setOnboardingComplete(true);
  };

  const skipOnboarding = () => {
    if (onboardingId) {
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