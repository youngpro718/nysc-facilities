-- db/migrations/026_security_fixes.sql
-- Security hardening: restrict privileged functions to admin users only

-- ─── approve_user_verification ───────────────────────────────────────────────
-- Add admin-only guard and revoke broad authenticated access

DROP FUNCTION IF EXISTS public.approve_user_verification(uuid, text, text);
CREATE OR REPLACE FUNCTION public.approve_user_verification(
  p_user_id uuid,
  p_role text DEFAULT 'standard',
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
  -- Require caller to be an admin
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET
    verification_status = 'verified',
    is_approved = true,
    access_level = CASE
      WHEN p_role IN ('admin', 'facilities_manager') THEN 'admin'
      WHEN p_role IN ('cmc', 'court_aide', 'purchasing_staff') THEN 'write'
      ELSE 'read'
    END,
    onboarded = true,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'approve_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'role', p_role,
      'admin_notes', p_admin_notes,
      'approved_at', NOW()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.approve_user_verification(uuid, text, text) IS 'Admin-only: approve a pending user and assign role. Enforces admin role check at runtime.';

-- ─── reject_user_verification ────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.reject_user_verification(uuid, text);
CREATE OR REPLACE FUNCTION public.reject_user_verification(
  p_user_id uuid,
  p_reason text DEFAULT NULL
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
    is_approved = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'reject_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'rejected_at', NOW()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO service_role;

COMMENT ON FUNCTION public.reject_user_verification(uuid, text) IS 'Admin-only: reject a pending user. Enforces admin role check at runtime.';

-- ─── handle_new_user ─────────────────────────────────────────────────────────
-- This is a trigger function fired by auth.users ON INSERT — not callable directly.
-- Authenticated users should not be able to invoke it as a function.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ─── Rate-limiting functions ──────────────────────────────────────────────────
-- These should only be callable from server-side / service_role, not by end users.

REVOKE EXECUTE ON FUNCTION public.increment_login_attempt(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_login_attempts(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_login_attempt(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts(TEXT) TO service_role;
