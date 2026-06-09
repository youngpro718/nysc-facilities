import { useAuth } from "./useAuth";

/**
 * useOnboarding — stub kept for backwards compat with a couple of callers.
 *
 * The post-signup onboarding wizard and getting-started checklist were removed.
 * Verified users land directly on their role dashboard via OnboardingGuard +
 * getDashboardForRole. This hook only exists so existing imports don't break;
 * `showOnboarding` is always false.
 */
export function useOnboarding() {
  // Keep the hook subscribed to auth so callers re-render predictably.
  useAuth();

  return {
    showOnboarding: false as const,
    onboardingComplete: true as const,
    startOnboarding: () => {},
    completeOnboarding: async () => {},
    skipOnboarding: async () => {},
  };
}
