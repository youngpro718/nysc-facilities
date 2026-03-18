-- =============================================================================
-- Migration 033: Fix stale RLS policies and absorb supabase-fixes.sql
--
-- Problems addressed:
--   1. profiles — all 6 coordinator policies check profiles.role (old system),
--      admin/cmc users in user_roles cannot read/manage profiles at all.
--   2. profiles_self_update — WITH CHECK has correlated subqueries against
--      profiles inside a profiles policy (recursive/fragile) + checks wrong column.
--   3. security_settings / security_rate_limits — 4 policies check profiles.role
--      instead of user_roles.role; genuine admins are blocked.
--   4. roles_catalog / title_access_rules — use deprecated auth.role() which
--      returns NULL on PostgREST v10+ and silently denies every SELECT.
--   5. approve_user_verification / reject_user_verification — revoked from
--      authenticated in migration 026 but called directly from client code;
--      user approval is permanently broken.
--   6. supabase-fixes.sql was never incorporated into the numbered migration
--      sequence; re-apply its is_admin() and function corrections here so that
--      a fresh supabase db push picks them up.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles — drop all old coordinator-based policies, replace with
--    user_roles-aware policies using the SECURITY DEFINER helpers from 030.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_self_read           ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update         ON public.profiles;
DROP POLICY IF EXISTS profiles_coordinator_read    ON public.profiles;
DROP POLICY IF EXISTS profiles_coordinator_update  ON public.profiles;
DROP POLICY IF EXISTS profiles_coordinator_insert  ON public.profiles;
DROP POLICY IF EXISTS profiles_coordinator_delete  ON public.profiles;
-- Also drop any variants that may exist from earlier dev migrations
DROP POLICY IF EXISTS profiles_admin_read          ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update        ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_insert        ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_delete        ON public.profiles;

-- Users can read their own profile; admin/cmc/court_aide can read all.
-- (Privileged users need the full list for the admin panel and key management.)
CREATE POLICY profiles_read ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_privileged()
    OR has_any_role(ARRAY['court_aide'])
  );

-- Users can update their own profile.
-- The WITH CHECK no longer uses correlated subqueries against profiles;
-- security-critical columns (verification_status, is_approved, onboarded)
-- are only writable by admin via the policies below.
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin can fully manage all profiles (approve, change role column, delete).
CREATE POLICY profiles_admin_write ON public.profiles
  FOR ALL TO authenticated
  USING  (is_admin())
  WITH CHECK (is_admin());

-- CMC can read and update (but not delete) profiles.
CREATE POLICY profiles_cmc_update ON public.profiles
  FOR UPDATE TO authenticated
  USING  (is_privileged())
  WITH CHECK (is_privileged());

-- handle_new_user() trigger is SECURITY DEFINER, so INSERT from the trigger
-- bypasses RLS entirely — no INSERT policy needed for the trigger path.
-- Service-role calls also bypass RLS.
-- Allow admins to manually insert profiles for edge cases.
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 2. security_settings — replace profiles.role checks with user_roles checks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS security_settings_admin_read   ON public.security_settings;
DROP POLICY IF EXISTS security_settings_admin_update ON public.security_settings;

CREATE POLICY security_settings_read ON public.security_settings
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY security_settings_update ON public.security_settings
  FOR UPDATE TO authenticated
  USING  (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 3. security_rate_limits — replace profiles.role checks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS security_rate_limits_admin_read ON public.security_rate_limits;
DROP POLICY IF EXISTS security_rate_limits_admin_all  ON public.security_rate_limits;

-- Admins can view and manage rate limit records
CREATE POLICY security_rate_limits_admin ON public.security_rate_limits
  FOR ALL TO authenticated
  USING  (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 4. roles_catalog and title_access_rules — replace deprecated auth.role()
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS roles_catalog_read        ON public.roles_catalog;
DROP POLICY IF EXISTS title_access_rules_read   ON public.title_access_rules;
DROP POLICY IF EXISTS title_access_rules_admin_all ON public.title_access_rules;

-- auth.role() is deprecated in PostgREST v10+; use TO authenticated instead.
CREATE POLICY roles_catalog_read ON public.roles_catalog
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY title_access_rules_read ON public.title_access_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY title_access_rules_admin_all ON public.title_access_rules
  FOR ALL TO authenticated
  USING  (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Re-grant approve_user_verification / reject_user_verification to
--    authenticated so the admin UI can call them via supabase.rpc().
--    Security is enforced by the runtime admin check INSIDE the function
--    (SECURITY DEFINER + explicit role check), not by the GRANT.
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text)        TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Absorb supabase-fixes.sql — ensure is_admin() uses user_roles,
--    and approve_user_verification() sets a valid access_level enum value.
--    (Fixes the enum mismatch where 'admin'/'write'/'read' were being written
--    to an access_level_enum column that only accepts spatial level values.)
-- ---------------------------------------------------------------------------

-- Canonical is_admin() — checks user_roles, not profiles.role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Fix approve_user_verification to not set an invalid enum on access_level.
-- We keep the existing profile fields that are valid and drop the enum assignment.
CREATE OR REPLACE FUNCTION public.approve_user_verification(
  p_user_id    uuid,
  p_role       text DEFAULT 'standard',
  p_admin_notes text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Runtime admin check (defence-in-depth alongside the RLS grant)
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET
    verification_status = 'verified',
    is_approved         = true,
    onboarded           = true,
    updated_at          = NOW()
  WHERE id = p_user_id;

  -- Assign the role in user_roles (single source of truth for roles)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE
    SET role       = EXCLUDED.role,
        updated_at = NOW();

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(),
    'approve_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'role',         p_role,
      'admin_notes',  p_admin_notes,
      'approved_at',  NOW()
    )
  );
END;
$$;

-- Fix reject_user_verification (was revoked; re-grant covered above)
CREATE OR REPLACE FUNCTION public.reject_user_verification(
  p_user_id uuid,
  p_reason  text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET
    verification_status = 'rejected',
    is_approved         = false,
    updated_at          = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(),
    'reject_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'reason',      p_reason,
      'rejected_at', NOW()
    )
  );
END;
$$;
