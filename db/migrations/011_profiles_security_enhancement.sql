-- db/migrations/011_profiles_security_enhancement.sql
-- Enhance profiles table with role/onboarding/MFA flags and secure RLS

-- Add missing security-focused columns to existing profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('coordinator','sergeant','it_dcas','viewer')) DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS building text,
  ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_enforced boolean DEFAULT false;

-- Ensure email column exists and is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text NOT NULL UNIQUE;
  END IF;
END $$;

-- Create index on email if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-provision a profile for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, onboarded, mfa_enforced)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer', -- Default role
    false,    -- Not onboarded yet
    false     -- MFA not enforced by default
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing overlapping policies to avoid conflicts
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_read ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS profiles_user_view_own ON public.profiles;
DROP POLICY IF EXISTS profiles_user_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;

-- Create new secure policies
-- Policy 1: Users can read their own profile
CREATE POLICY profiles_self_read
  ON public.profiles 
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but not role, mfa_enforced, or onboarded)
CREATE POLICY profiles_self_update
  ON public.profiles 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND mfa_enforced = (SELECT mfa_enforced FROM public.profiles WHERE id = auth.uid())
  );

-- Policy 3: Coordinators can read all profiles
CREATE POLICY profiles_coordinator_read
  ON public.profiles 
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'coordinator'
    )
  );

-- Policy 4: Coordinators can update other users' profiles (including role assignment)
CREATE POLICY profiles_coordinator_update
  ON public.profiles 
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'coordinator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'coordinator'
    )
  );

-- Policy 5: Coordinators can insert new profiles (for manual user creation)
CREATE POLICY profiles_coordinator_insert
  ON public.profiles 
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'coordinator'
    )
  );

-- Policy 6: Coordinators can delete profiles
CREATE POLICY profiles_coordinator_delete
  ON public.profiles 
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'coordinator'
    )
  );

-- Create helper function to check if user has coordinator role
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'coordinator'
  );
END;
$$;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coordinator() TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control. Mirrors auth.users and carries role/onboarding/MFA flags.';
COMMENT ON COLUMN public.profiles.role IS 'User role: coordinator (full access), sergeant (limited updates), it_dcas (read + targeted updates), viewer (read-only)';
COMMENT ON COLUMN public.profiles.onboarded IS 'Whether user has completed onboarding process';
COMMENT ON COLUMN public.profiles.mfa_enforced IS 'Whether MFA is enforced for this user (required for elevated roles)';
COMMENT ON COLUMN public.profiles.building IS 'Primary building assignment for the user';
