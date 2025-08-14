import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding-${user.id}`);
      
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      } else {
        setOnboardingComplete(true);
      }
    }
  }, [user, profile]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding-${user.id}`, 'completed');
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  };

  const skipOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding-${user.id}`, 'skipped');
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  };

  return {
    showOnboarding,
    onboardingComplete,
    completeOnboarding,
    skipOnboarding
  };
}