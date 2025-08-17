-- Create per-row logging SELECT policy for profiles
-- Separated from core migration to avoid DDL-in-DO limitations

-- Ensure RLS is enabled (harmless if already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Replace existing policy if present
DROP POLICY IF EXISTS profiles_select_logging ON public.profiles;

-- Add logging policy: preserve permissive access (true) and log as side-effect
CREATE POLICY profiles_select_logging
ON public.profiles
FOR SELECT
USING (
  true
  AND public.log_profile_access_row(profiles)
);
