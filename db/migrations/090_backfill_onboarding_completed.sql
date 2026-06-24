-- 090: backfill onboarding_completed for users who already passed the old check.
--
-- Until now OnboardingGuard required only first_name + last_name. The
-- onboarding_completed column existed but nothing wrote to it, so every
-- existing user has it false even though they're plainly past onboarding.
--
-- This migration:
--   1. Marks any user whose first_name AND last_name are set as
--      onboarding_completed=true (with onboarding_completed_at = created_at
--      as a best-effort historical timestamp).
--   2. Leaves users WITHOUT a name false so the new guard correctly routes
--      them to /onboarding/profile.
--
-- After this lands, the guard switches to checking onboarding_completed and
-- ProfileOnboarding sets the column on submit — together making the column
-- finally mean what it says.

BEGIN;

UPDATE public.profiles
SET
  onboarding_completed = true,
  onboarding_completed_at = COALESCE(onboarding_completed_at, created_at, now())
WHERE onboarding_completed = false
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL
  AND length(trim(first_name)) > 0
  AND length(trim(last_name)) > 0;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  total integer;
  completed integer;
  pending integer;
BEGIN
  SELECT COUNT(*) INTO total FROM public.profiles;
  SELECT COUNT(*) INTO completed FROM public.profiles WHERE onboarding_completed = true;
  SELECT COUNT(*) INTO pending FROM public.profiles WHERE onboarding_completed = false;
  RAISE NOTICE '090: profiles total=%, onboarding_completed=true=%, false=%',
    total, completed, pending;
END$$;
